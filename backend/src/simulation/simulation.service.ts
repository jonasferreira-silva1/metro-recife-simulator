import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Train, DirectionEnum } from './train.entity';
import { LineEnum, Station } from '../stations/stations.entity';
import { StationsService } from '../stations/stations.service';
import { EventsService } from '../events/events.service';
import { SimulationGateway } from './simulation.gateway';
import { TrainState, processTick, TrainContext, StationData } from './state-machine';
import { EventType } from '../events/events.entity';

/**
 * Serviço responsável por orquestrar toda a simulação do Metrô.
 * - Loop de ticks (FSM autônoma)
 * - Comandos do operador via WebSocket/REST (Fase 3)
 */
@Injectable()
export class SimulationService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(SimulationService.name);
  private timer: NodeJS.Timeout;
  private isTickRunning = false;

  /** Trens em parada forçada — a FSM não avança até operator:release */
  private readonly operatorHeldTrainIds = new Set<string>();

  /** Evita emitir o mesmo alerta de limite repetidamente no mesmo incidente */
  private readonly activeAlerts = new Set<string>();

  private stationsByLine: Record<LineEnum, Station[]> = {
    [LineEnum.CENTRO]: [],
    [LineEnum.SUL]: [],
  };

  private tickIntervalMs: number;
  private doorProbability: number;
  private maxDoorAttempts: number;
  private doorBlockTimeoutTicks: number;

  constructor(
    @InjectRepository(Train)
    private readonly trainRepository: Repository<Train>,
    private readonly stationsService: StationsService,
    private readonly eventsService: EventsService,
    @Inject(forwardRef(() => SimulationGateway))
    private readonly gateway: SimulationGateway,
    private readonly configService: ConfigService,
  ) {
    this.tickIntervalMs = this.configService.get<number>('SIMULATION_TICK_MS', 1000);
    this.doorProbability = this.configService.get<number>('DOOR_SENSOR_PROBABILITY', 0.1);
    this.maxDoorAttempts = this.configService.get<number>('MAX_DOOR_ATTEMPTS', 3);
    // DOOR_BLOCK_TIMEOUT está em segundos; com tick de 1s, ticks ≈ segundos
    const timeoutSec = this.configService.get<number>('DOOR_BLOCK_TIMEOUT', 30);
    this.doorBlockTimeoutTicks = timeoutSec;
  }

  async onApplicationBootstrap() {
    await this.loadStations();
    await this.initializeTrains();
    this.startSimulation();
  }

  onApplicationShutdown() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async loadStations() {
    this.stationsByLine[LineEnum.CENTRO] = await this.stationsService.findByLine(LineEnum.CENTRO);
    this.stationsByLine[LineEnum.SUL] = await this.stationsService.findByLine(LineEnum.SUL);
  }

  private async initializeTrains() {
    const existingTrains = await this.trainRepository.count();
    if (existingTrains === 0) {
      this.logger.log('Inicializando trens de seed...');

      const centroStation = this.stationsByLine[LineEnum.CENTRO][0];
      const sulStation = this.stationsByLine[LineEnum.SUL][0];

      if (centroStation) {
        await this.trainRepository.save(
          this.trainRepository.create({
            name: 'Trem Centro 01',
            line: LineEnum.CENTRO,
            state: TrainState.STOPPED,
            currentStation: centroStation,
            direction: DirectionEnum.FORWARD,
          }),
        );
      }

      if (sulStation) {
        await this.trainRepository.save(
          this.trainRepository.create({
            name: 'Trem Sul 01',
            line: LineEnum.SUL,
            state: TrainState.STOPPED,
            currentStation: sulStation,
            direction: DirectionEnum.FORWARD,
          }),
        );
      }
    }

    // Garante nextStation correto para trens já existentes (ex.: após restart)
    const trains = await this.trainRepository.find({
      relations: ['currentStation', 'nextStation'],
    });
    for (const train of trains) {
      this.syncNextStation(train, this.stationsByLine[train.line]);
      await this.trainRepository.save(train);
    }
  }

  /**
   * Define a próxima estação com base na posição atual e no sentido do trem.
   * currentStation = estação onde parou OU origem do trecho em MOVING/ARRIVING.
   */
  private syncNextStation(train: Train, lineStations: Station[]) {
    const currentIndex = lineStations.findIndex((s) => s.id === train.currentStation?.id);
    if (currentIndex === -1) {
      train.nextStation = null;
      return;
    }

    const nextIndex =
      train.direction === DirectionEnum.FORWARD ? currentIndex + 1 : currentIndex - 1;

    train.nextStation =
      nextIndex >= 0 && nextIndex < lineStations.length ? lineStations[nextIndex] : null;
  }

  private startSimulation() {
    this.logger.log(`Loop de simulação iniciado (${this.tickIntervalMs}ms por tick)`);
    this.timer = setInterval(() => void this.tick(), this.tickIntervalMs);
  }

  // ── Comandos do operador (Fase 3) ─────────────────────────────────────────

  /**
   * Simula bloqueio manual do sensor de porta (botão no painel).
   * Só é válido com portas abertas ou fechando.
   */
  async blockDoor(trainId: string): Promise<void> {
    const train = await this.findTrainOrFail(trainId);
    const allowed: TrainState[] = [TrainState.DOORS_OPEN, TrainState.DOORS_CLOSING];

    if (!allowed.includes(train.state)) {
      throw new BadRequestException(
        `Não é possível bloquear porta no estado ${train.state}. Aguarde portas abertas ou fechando.`,
      );
    }

    train.state = TrainState.DOOR_BLOCKED;
    train.timeInState = 0;
    train.doorAttempts += 1;

    await this.trainRepository.save(train);
    await this.persistAndEmitDoorEvent(train, 'blocked');
    await this.checkDoorThresholds(train);
  }

  /** Remove obstrução e reabre as portas */
  async unblockDoor(trainId: string): Promise<void> {
    const train = await this.findTrainOrFail(trainId);

    if (train.state !== TrainState.DOOR_BLOCKED) {
      throw new BadRequestException('Trem não está com porta bloqueada.');
    }

    train.state = TrainState.DOORS_OPEN;
    train.timeInState = 0;

    await this.trainRepository.save(train);
    await this.persistAndEmitDoorEvent(train, 'unblocked');
  }

  /** Parada de emergência — congela a FSM para este trem */
  async forceStop(trainId: string): Promise<void> {
    const train = await this.findTrainOrFail(trainId);
    const movingStates: TrainState[] = [TrainState.MOVING, TrainState.ARRIVING, TrainState.DEPARTING];

    if (!movingStates.includes(train.state)) {
      throw new BadRequestException('Parada forçada só é permitida com trem em movimento.');
    }

    train.state = TrainState.STOPPED;
    train.timeInState = 0;
    this.operatorHeldTrainIds.add(trainId);

    await this.trainRepository.save(train);
    this.emitStateChange(train);

    await this.eventsService.logEvent(EventType.OPERATOR_ALERT, train.id, train.currentStation?.id, {
      alertType: 'emergency',
    });

    this.gateway.emitOperatorAlert({
      trainId: train.id,
      alertType: 'emergency',
      stationId: train.currentStation.id,
      message: `${train.name}: parada de emergência acionada pelo operador.`,
    });
  }

  /**
   * Libera o trem após intervenção manual.
   * Limpa retenção do operador e reinicia o fluxo de portas.
   */
  async releaseTrain(trainId: string): Promise<void> {
    const train = await this.findTrainOrFail(trainId);

    this.operatorHeldTrainIds.delete(trainId);
    this.activeAlerts.delete(trainId);
    train.doorAttempts = 0;

    if (train.state === TrainState.DOOR_BLOCKED) {
      train.state = TrainState.DOORS_OPEN;
    } else if (train.state === TrainState.STOPPED) {
      train.state = TrainState.DOORS_OPEN;
    }

    train.timeInState = 0;
    await this.trainRepository.save(train);
    this.emitStateChange(train);

    await this.eventsService.logEvent(EventType.DOOR_UNBLOCKED, train.id, train.currentStation?.id);
  }

  /** Altera o multiplicador de velocidade de todos os trens */
  async setSimulationSpeed(multiplier: number): Promise<void> {
    const allowed = [1, 2, 5, 10];
    if (!allowed.includes(multiplier)) {
      throw new BadRequestException(`Velocidade inválida. Use: ${allowed.join(', ')}`);
    }

    await this.trainRepository
      .createQueryBuilder()
      .update(Train)
      .set({ speedMultiplier: multiplier })
      .execute();

    await this.eventsService.logEvent(EventType.SPEED_CHANGED, undefined, undefined, {
      multiplier,
    });

    this.logger.log(`Velocidade da simulação alterada para ${multiplier}x`);
  }

  // ── Loop principal ────────────────────────────────────────────────────────

  private async tick() {
    if (this.isTickRunning) {
      return;
    }
    this.isTickRunning = true;

    try {
      const trains = await this.trainRepository.find({
        relations: ['currentStation', 'nextStation'],
      });
      const timestamp = new Date().toISOString();
      const snapshotPayload = [];

      for (const train of trains) {
        await this.processTrainTick(train, timestamp);
        snapshotPayload.push(this.buildSnapshot(train));
      }

      this.gateway.emitSimulationTick({ timestamp, trains: snapshotPayload });
    } finally {
      this.isTickRunning = false;
    }
  }

  private async processTrainTick(train: Train, timestamp: string) {
    // Trem retido pelo operador: apenas incrementa tempo, sem FSM
    if (this.operatorHeldTrainIds.has(train.id)) {
      train.timeInState += 1;
      await this.trainRepository.update(train.id, { timeInState: train.timeInState });
      return;
    }

    const lineStations = this.stationsByLine[train.line];
    const currentStationIndex = lineStations.findIndex((s) => s.id === train.currentStation?.id);

    if (currentStationIndex === -1) {
      return;
    }

    // Timeout em DOOR_BLOCKED → alerta de escalonamento
    if (train.state === TrainState.DOOR_BLOCKED) {
      await this.checkDoorBlockTimeout(train);
    }

    const context: TrainContext = {
      id: train.id,
      state: train.state,
      currentStationIndex,
      timeInState: train.timeInState,
      doorAttempts: train.doorAttempts,
      lineLength: lineStations.length,
      speedMultiplier: train.speedMultiplier,
      isForward: train.direction === DirectionEnum.FORWARD,
    };

    const currentStationData: StationData = {
      id: train.currentStation.id,
      name: train.currentStation.name,
      dwellTime: train.currentStation.dwellTime,
    };

    const result = processTick(
      context,
      currentStationData,
      this.doorProbability,
      this.maxDoorAttempts,
    );

    if (result) {
      const previousState = train.state;
      train.state = result.newState;
      train.timeInState = 0;

      if (result.doorAttemptsReset) {
        train.doorAttempts = 0;
        this.activeAlerts.delete(train.id);
      } else if (
        result.newState === TrainState.DOOR_BLOCKED &&
        previousState !== TrainState.DOOR_BLOCKED
      ) {
        train.doorAttempts += 1;
        await this.persistAndEmitDoorEvent(train, 'blocked');
        await this.checkDoorThresholds(train);
      }

      if (result.directionReversed) {
        train.direction =
          train.direction === DirectionEnum.FORWARD
            ? DirectionEnum.RETURN
            : DirectionEnum.FORWARD;
      }

      if (result.stationIndexDelta !== 0) {
        const newIndex = currentStationIndex + result.stationIndexDelta;
        if (newIndex >= 0 && newIndex < lineStations.length) {
          train.currentStation = lineStations[newIndex];
        }
      }

      this.syncNextStation(train, lineStations);

      await this.trainRepository.save(train);
      this.emitStateChange(train, timestamp);

      if (result.eventToEmit === 'train:arrived') {
        // Após stationIndexDelta, currentStation já é a estação de chegada (ex.: Recife)
        this.gateway.emitTrainArrived({
          trainId: train.id,
          trainName: train.name,
          line: train.line,
          stationId: train.currentStation.id,
          stationName: train.currentStation.name,
          dwellTime: train.currentStation.dwellTime,
        });
        await this.eventsService.logEvent(
          EventType.TRAIN_ARRIVED,
          train.id,
          train.currentStation.id,
          { stationName: train.currentStation.name },
        );
      } else if (result.eventToEmit === 'train:departed') {
        // Ao partir, currentStation ainda é a origem do trecho (ex.: Joana Bezerra → Recife)
        const toStation = train.nextStation;
        this.gateway.emitTrainDeparted({
          trainId: train.id,
          trainName: train.name,
          line: train.line,
          fromStationId: currentStationData.id,
          fromStationName: currentStationData.name,
          toStationId: toStation?.id ?? currentStationData.id,
          toStationName: toStation?.name ?? currentStationData.name,
        });
        await this.eventsService.logEvent(
          EventType.TRAIN_DEPARTED,
          train.id,
          currentStationData.id,
          { stationName: currentStationData.name, toStationName: toStation?.name },
        );
      }
    } else {
      train.timeInState += 1;
      await this.trainRepository.update(train.id, { timeInState: train.timeInState });
    }
  }

  /** Emite alerta quando tentativas ou timeout do sensor são atingidos */
  private async checkDoorThresholds(train: Train) {
    if (train.doorAttempts >= this.maxDoorAttempts && !this.activeAlerts.has(train.id)) {
      await this.raiseOperatorAlert(
        train,
        'max_attempts',
        `${train.name}: sensor acionado ${train.doorAttempts} vezes. Intervenção necessária.`,
      );
    }
  }

  private async checkDoorBlockTimeout(train: Train) {
    if (train.timeInState >= this.doorBlockTimeoutTicks && !this.activeAlerts.has(train.id)) {
      await this.raiseOperatorAlert(
        train,
        'door_timeout',
        `${train.name}: porta bloqueada há mais de ${this.doorBlockTimeoutTicks}s. Escalonamento manual.`,
      );
    }
  }

  private async raiseOperatorAlert(
    train: Train,
    alertType: 'door_timeout' | 'max_attempts' | 'emergency',
    message: string,
  ) {
    this.activeAlerts.add(train.id);

    await this.eventsService.logEvent(EventType.OPERATOR_ALERT, train.id, train.currentStation?.id, {
      alertType,
      message,
    });

    this.gateway.emitOperatorAlert({
      trainId: train.id,
      alertType,
      stationId: train.currentStation.id,
      message,
    });
  }

  private async persistAndEmitDoorEvent(train: Train, event: 'blocked' | 'unblocked') {
    const eventType = event === 'blocked' ? EventType.DOOR_BLOCKED : EventType.DOOR_UNBLOCKED;
    await this.eventsService.logEvent(eventType, train.id, train.currentStation?.id, {
      attempts: train.doorAttempts,
    });

    this.gateway.emitTrainDoorEvent({
      trainId: train.id,
      trainName: train.name,
      line: train.line,
      event,
      attempts: train.doorAttempts,
      stationId: train.currentStation.id,
      stationName: train.currentStation.name,
    });

    this.emitStateChange(train);
  }

  private emitStateChange(train: Train, timestamp?: string) {
    this.gateway.emitStateChanged({
      trainId: train.id,
      state: train.state,
      stationId: train.currentStation?.id,
      timestamp: timestamp ?? new Date().toISOString(),
    });
  }

  private buildSnapshot(train: Train) {
    return {
      id: train.id,
      name: train.name,
      line: train.line,
      state: train.state,
      currentStation: train.currentStation?.name ?? null,
      nextStation: train.nextStation?.name ?? null,
      currentStationOrder: train.currentStation?.orderIndex ?? 0,
      nextStationOrder: train.nextStation?.orderIndex ?? null,
      direction: train.direction,
      doorAttempts: train.doorAttempts,
      speedMultiplier: train.speedMultiplier,
      timeInState: train.timeInState,
    };
  }

  private async findTrainOrFail(trainId: string): Promise<Train> {
    const train = await this.trainRepository.findOne({
      where: { id: trainId },
      relations: ['currentStation', 'nextStation'],
    });
    if (!train) {
      throw new NotFoundException(`Trem ${trainId} não encontrado.`);
    }
    return train;
  }

  async getStatus() {
    const trains = await this.trainRepository.find({
      relations: ['currentStation', 'nextStation'],
    });
    return {
      timestamp: new Date().toISOString(),
      trains,
    };
  }

  async getRecentEvents(limit = 100) {
    return this.eventsService.getRecentEvents(limit);
  }
}
