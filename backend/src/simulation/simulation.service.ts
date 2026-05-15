import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
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
 * Ele inicializa os trens, mantém um loop de tempo (setInterval) e processa
 * o estado de cada trem a cada "tick", emitindo eventos via WebSocket.
 */
@Injectable()
export class SimulationService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(SimulationService.name);
  private timer: NodeJS.Timeout;
  
  // Cache for stations
  private stationsByLine: Record<LineEnum, Station[]> = {
    [LineEnum.CENTRO]: [],
    [LineEnum.SUL]: [],
  };

  private tickIntervalMs: number;
  private doorProbability: number;
  private maxDoorAttempts: number;

  constructor(
    @InjectRepository(Train)
    private readonly trainRepository: Repository<Train>,
    private readonly stationsService: StationsService,
    private readonly eventsService: EventsService,
    private readonly gateway: SimulationGateway,
    private readonly configService: ConfigService,
  ) {
    this.tickIntervalMs = this.configService.get<number>('SIMULATION_TICK_MS', 1000);
    this.doorProbability = this.configService.get<number>('DOOR_SENSOR_PROBABILITY', 0.1);
    this.maxDoorAttempts = this.configService.get<number>('MAX_DOOR_ATTEMPTS', 3);
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
      this.logger.log('Initializing seed trains...');
      
      const centroStation = this.stationsByLine[LineEnum.CENTRO][0];
      const sulStation = this.stationsByLine[LineEnum.SUL][0];

      if (centroStation) {
        await this.trainRepository.save(this.trainRepository.create({
          name: 'Trem Centro 01',
          line: LineEnum.CENTRO,
          state: TrainState.STOPPED,
          currentStation: centroStation,
          direction: DirectionEnum.FORWARD,
        }));
      }

      if (sulStation) {
        await this.trainRepository.save(this.trainRepository.create({
          name: 'Trem Sul 01',
          line: LineEnum.SUL,
          state: TrainState.STOPPED,
          currentStation: sulStation,
          direction: DirectionEnum.FORWARD,
        }));
      }
    }
  }

  /**
   * Inicializa o loop principal da simulação.
   * Roda infinitamente a cada SIMULATION_TICK_MS (padrão 1000ms = 1 segundo).
   */
  private startSimulation() {
    this.logger.log(`Starting simulation loop (${this.tickIntervalMs}ms per tick)`);
    this.timer = setInterval(() => this.tick(), this.tickIntervalMs);
  }

  /**
   * O "Coração" da Simulação. Este método roda a cada segundo.
   * Para cada trem cadastrado no banco:
   * 1. Pega o estado atual.
   * 2. Joga na Máquina de Estados (processTick).
   * 3. Salva no banco de dados se houve mudança.
   * 4. Emite eventos via WebSocket.
   */
  private async tick() {
    // Process all trains
    const trains = await this.trainRepository.find({ relations: ['currentStation', 'nextStation'] });
    const timestamp = new Date().toISOString();

    const snapshotPayload = [];

    for (const train of trains) {
      // Create context for FSM
      const lineStations = this.stationsByLine[train.line];
      const currentStationIndex = lineStations.findIndex(s => s.id === train.currentStation.id);
      
      if (currentStationIndex === -1) continue; // Safety check

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

      // 2. Chama a Máquina de Estados (FSM) para decidir o que o trem deve fazer
      const result = processTick(context, currentStationData, this.doorProbability, this.maxDoorAttempts);

      if (result) {
        // A FSM retornou uma transição de estado!
        const previousState = train.state;
        train.state = result.newState;
        train.timeInState = 0; // Reseta o tempo no novo estado
        
        if (result.doorAttemptsReset) {
          train.doorAttempts = 0;
        } else if (result.newState === TrainState.DOOR_BLOCKED && previousState !== TrainState.DOOR_BLOCKED) {
          train.doorAttempts += 1;
        }

        if (result.directionReversed) {
          train.direction = train.direction === DirectionEnum.FORWARD ? DirectionEnum.RETURN : DirectionEnum.FORWARD;
        }

        if (result.stationIndexDelta !== 0) {
          const newIndex = currentStationIndex + result.stationIndexDelta;
          if (newIndex >= 0 && newIndex < lineStations.length) {
            train.currentStation = lineStations[newIndex];
          }
        }

        // Determine next station for display logic
        let nextIndex = lineStations.findIndex(s => s.id === train.currentStation.id) + (train.direction === DirectionEnum.FORWARD ? 1 : -1);
        if (nextIndex >= 0 && nextIndex < lineStations.length) {
          train.nextStation = lineStations[nextIndex];
        } else {
          train.nextStation = null;
        }

        // Atualiza a entidade Trem no banco de dados
        await this.trainRepository.save(train);

        // 3. Emite os Eventos WebSockets (Para o Front-End escutar em tempo real)
        this.gateway.emitStateChanged({
          trainId: train.id,
          state: train.state,
          stationId: train.currentStation.id,
          timestamp,
        });

        // Eventos Especiais e Persistência de Logs
        if (result.eventToEmit === 'train:arrived') {
          this.gateway.emitTrainArrived({ trainId: train.id, stationId: train.currentStation.id, dwellTime: train.currentStation.dwellTime });
          await this.eventsService.logEvent(EventType.TRAIN_ARRIVED, train.id, train.currentStation.id);
        } else if (result.eventToEmit === 'train:departed') {
          this.gateway.emitTrainDeparted({ trainId: train.id, fromStationId: currentStationData.id, toStationId: train.currentStation.id });
          await this.eventsService.logEvent(EventType.TRAIN_DEPARTED, train.id, train.currentStation.id);
        }

      } else {
        // Nenhuma transição de estado (o trem continua onde estava). Apenas soma +1 no tempo.
        train.timeInState += 1;
        await this.trainRepository.update(train.id, { timeInState: train.timeInState });
      }

      snapshotPayload.push({
        id: train.id,
        name: train.name,
        line: train.line,
        state: train.state,
        currentStation: train.currentStation?.name,
        nextStation: train.nextStation?.name,
        direction: train.direction,
      });
    }

    // Global tick event
    this.gateway.emitSimulationTick({
      timestamp,
      trains: snapshotPayload,
    });
  }

  async getStatus() {
    const trains = await this.trainRepository.find({ relations: ['currentStation', 'nextStation'] });
    return {
      timestamp: new Date().toISOString(),
      trains,
    };
  }
}
