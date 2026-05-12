import { v4 as uuidv4 } from "uuid";
import {
  Train,
  TrainState,
  Line,
  Direction,
  SimulationEvent,
  EventType,
  SimulationConfig,
  TrainStateChangedEvent,
  TrainDoorEvent,
  OperatorAlert,
  Station,
} from "./types";
import { getStationsByLine, getNextStation, getTerminalStation } from "./stations";
import { transition, isValidTransition, getDefaultStateDuration } from "./state-machine";

// Configuração padrão
const defaultConfig: SimulationConfig = {
  tickMs: 1000,
  defaultDwellTime: 30,
  doorSensorProbability: 0.1,
  maxDoorAttempts: 3,
  doorBlockTimeout: 30,
};

// Classe principal da Simulação
export class SimulationEngine {
  private trains: Map<string, Train> = new Map();
  private events: SimulationEvent[] = [];
  private config: SimulationConfig;
  private stateTimers: Map<string, number> = new Map();
  private speedMultiplier: number = 1;
  private isRunning: boolean = false;
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  // Callbacks para eventos
  public onStateChanged?: (event: TrainStateChangedEvent) => void;
  public onDoorEvent?: (event: TrainDoorEvent) => void;
  public onOperatorAlert?: (alert: OperatorAlert) => void;
  public onTick?: (trains: Train[]) => void;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Inicializa a simulação com trens
  public initialize(): void {
    this.createTrain("Trem Centro 01", Line.CENTRO, "start");
    this.createTrain("Trem Centro 02", Line.CENTRO, "end");
    this.createTrain("Trem Sul 01", Line.SUL, "start");
    this.createTrain("Trem Sul 02", Line.SUL, "end");
  }

  // Cria um novo trem
  private createTrain(name: string, line: Line, startPosition: "start" | "end"): Train {
    const startStation = getTerminalStation(line, startPosition);
    const direction = startPosition === "start" ? Direction.FORWARD : Direction.RETURN;
    const nextStation = getNextStation(startStation, direction);

    const train: Train = {
      id: uuidv4(),
      name,
      line,
      state: TrainState.DOORS_OPEN, // Começa na estação com portas abertas
      currentStation: startStation,
      nextStation,
      direction,
      doorAttempts: 0,
      speedMultiplier: 1,
      progress: 0,
      updatedAt: new Date(),
    };

    this.trains.set(train.id, train);
    this.stateTimers.set(train.id, getDefaultStateDuration(train.state, train.currentStation.dwellTime));
    
    return train;
  }

  // Inicia a simulação
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.tickInterval = setInterval(() => {
      this.tick();
    }, this.config.tickMs / this.speedMultiplier);
  }

  // Para a simulação
  public stop(): void {
    this.isRunning = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  // Define a velocidade da simulação
  public setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
    this.logEvent(null, null, EventType.SPEED_CHANGED, { multiplier });
  }

  // Processa um tick da simulação
  private tick(): void {
    this.trains.forEach((train) => {
      this.processTrain(train);
    });

    this.onTick?.(this.getTrains());
  }

  // Processa o estado de um trem
  private processTrain(train: Train): void {
    const timer = this.stateTimers.get(train.id) || 0;

    if (timer > 0) {
      this.stateTimers.set(train.id, timer - 1);
      
      // Atualiza progresso se estiver em movimento
      if (train.state === TrainState.MOVING) {
        const totalTicks = 15; // ticks para completar o trajeto
        const currentProgress = 100 - (timer / totalTicks) * 100;
        train.progress = Math.min(100, Math.max(0, currentProgress));
      }
      
      return;
    }

    // Timer chegou a zero, processa transição
    this.processStateTransition(train);
  }

  // Processa a transição de estado
  private processStateTransition(train: Train): void {
    const currentState = train.state;
    let nextState: TrainState;
    let shouldEmitEvent = true;

    switch (currentState) {
      case TrainState.MOVING:
        nextState = TrainState.ARRIVING;
        break;

      case TrainState.ARRIVING:
        nextState = TrainState.STOPPED;
        this.logEvent(train, train.currentStation, EventType.TRAIN_ARRIVED);
        break;

      case TrainState.STOPPED:
        nextState = TrainState.DOORS_OPEN;
        this.logEvent(train, train.currentStation, EventType.DOORS_OPENED);
        break;

      case TrainState.DOORS_OPEN:
        // Chance de bloqueio aleatório
        if (Math.random() < this.config.doorSensorProbability) {
          nextState = TrainState.DOOR_BLOCKED;
          train.doorAttempts++;
          this.logEvent(train, train.currentStation, EventType.DOOR_BLOCKED, { attempts: train.doorAttempts });
          this.emitDoorEvent(train, "blocked");
        } else {
          nextState = TrainState.DOORS_CLOSING;
        }
        break;

      case TrainState.DOOR_BLOCKED:
        nextState = TrainState.DOORS_OPEN;
        this.logEvent(train, train.currentStation, EventType.DOOR_UNBLOCKED);
        this.emitDoorEvent(train, "unblocked");

        // Verifica se atingiu máximo de tentativas
        if (train.doorAttempts >= this.config.maxDoorAttempts) {
          this.emitOperatorAlert(train, "max_attempts", `Porta bloqueada ${train.doorAttempts} vezes`);
        }
        break;

      case TrainState.DOORS_CLOSING:
        nextState = TrainState.DEPARTING;
        this.logEvent(train, train.currentStation, EventType.DOORS_CLOSED);
        break;

      case TrainState.DEPARTING:
        nextState = TrainState.MOVING;
        train.doorAttempts = 0;
        train.progress = 0;
        
        // Move para próxima estação
        this.moveToNextStation(train);
        this.logEvent(train, train.currentStation, EventType.TRAIN_DEPARTED);
        break;

      default:
        return;
    }

    // Aplica a transição
    if (isValidTransition(currentState, nextState)) {
      train.state = transition(currentState, nextState);
      train.updatedAt = new Date();
      this.stateTimers.set(train.id, getDefaultStateDuration(train.state, train.currentStation.dwellTime));

      if (shouldEmitEvent) {
        this.emitStateChanged(train);
      }
    }
  }

  // Move o trem para a próxima estação
  private moveToNextStation(train: Train): void {
    const nextStation = train.nextStation;
    
    if (!nextStation) {
      // Chegou no terminal, inverte direção
      train.direction = train.direction === Direction.FORWARD ? Direction.RETURN : Direction.FORWARD;
      const newNext = getNextStation(train.currentStation, train.direction);
      train.nextStation = newNext;
    } else {
      train.currentStation = nextStation;
      const newNext = getNextStation(nextStation, train.direction);
      
      if (!newNext) {
        // Próxima é terminal, inverte direção
        train.direction = train.direction === Direction.FORWARD ? Direction.RETURN : Direction.FORWARD;
        train.nextStation = getNextStation(nextStation, train.direction);
      } else {
        train.nextStation = newNext;
      }
    }
  }

  // Simula bloqueio de porta manual
  public blockDoor(trainId: string): void {
    const train = this.trains.get(trainId);
    if (!train) return;

    if (train.state === TrainState.DOORS_OPEN || train.state === TrainState.DOORS_CLOSING) {
      train.state = TrainState.DOOR_BLOCKED;
      train.doorAttempts++;
      train.updatedAt = new Date();
      this.stateTimers.set(trainId, getDefaultStateDuration(TrainState.DOOR_BLOCKED, train.currentStation.dwellTime));
      
      this.logEvent(train, train.currentStation, EventType.DOOR_BLOCKED, { manual: true, attempts: train.doorAttempts });
      this.emitDoorEvent(train, "blocked");
      this.emitStateChanged(train);
    }
  }

  // Remove bloqueio de porta manual
  public unblockDoor(trainId: string): void {
    const train = this.trains.get(trainId);
    if (!train) return;

    if (train.state === TrainState.DOOR_BLOCKED) {
      train.state = TrainState.DOORS_OPEN;
      train.updatedAt = new Date();
      this.stateTimers.set(trainId, getDefaultStateDuration(TrainState.DOORS_OPEN, train.currentStation.dwellTime));
      
      this.logEvent(train, train.currentStation, EventType.DOOR_UNBLOCKED, { manual: true });
      this.emitDoorEvent(train, "unblocked");
      this.emitStateChanged(train);
    }
  }

  // Força parada de emergência
  public forceStop(trainId: string): void {
    const train = this.trains.get(trainId);
    if (!train) return;

    train.state = TrainState.STOPPED;
    train.updatedAt = new Date();
    this.stateTimers.set(trainId, 999); // Timer alto para manter parado

    this.emitOperatorAlert(train, "emergency", "Parada de emergência acionada");
    this.emitStateChanged(train);
  }

  // Libera trem após intervenção
  public releaseTrain(trainId: string): void {
    const train = this.trains.get(trainId);
    if (!train) return;

    if (train.state === TrainState.STOPPED || train.state === TrainState.DOOR_BLOCKED) {
      train.state = TrainState.DOORS_OPEN;
      train.doorAttempts = 0;
      train.updatedAt = new Date();
      this.stateTimers.set(trainId, getDefaultStateDuration(TrainState.DOORS_OPEN, train.currentStation.dwellTime));

      this.emitStateChanged(train);
    }
  }

  // Emite evento de mudança de estado
  private emitStateChanged(train: Train): void {
    const event: TrainStateChangedEvent = {
      trainId: train.id,
      trainName: train.name,
      state: train.state,
      station: train.currentStation,
      nextStation: train.nextStation,
      direction: train.direction,
      progress: train.progress,
      timestamp: new Date(),
    };
    this.onStateChanged?.(event);
  }

  // Emite evento de porta
  private emitDoorEvent(train: Train, event: "blocked" | "unblocked"): void {
    const doorEvent: TrainDoorEvent = {
      trainId: train.id,
      trainName: train.name,
      event,
      attempts: train.doorAttempts,
      station: train.currentStation,
      timestamp: new Date(),
    };
    this.onDoorEvent?.(doorEvent);
  }

  // Emite alerta para operador
  private emitOperatorAlert(train: Train, alertType: "door_timeout" | "max_attempts" | "emergency", message: string): void {
    const alert: OperatorAlert = {
      trainId: train.id,
      trainName: train.name,
      alertType,
      station: train.currentStation,
      message,
      timestamp: new Date(),
    };
    this.onOperatorAlert?.(alert);
  }

  // Loga evento na lista de eventos
  private logEvent(
    train: Train | null,
    station: Station | null,
    eventType: EventType,
    payload?: Record<string, unknown>
  ): void {
    const event: SimulationEvent = {
      id: uuidv4(),
      trainId: train?.id || "",
      stationId: station?.id || "",
      stationName: station?.name || "",
      eventType,
      payload,
      occurredAt: new Date(),
    };
    this.events.push(event);

    // Mantém apenas os últimos 100 eventos
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  // Getters
  public getTrains(): Train[] {
    return Array.from(this.trains.values());
  }

  public getTrain(id: string): Train | undefined {
    return this.trains.get(id);
  }

  public getEvents(): SimulationEvent[] {
    return [...this.events];
  }

  public getSpeed(): number {
    return this.speedMultiplier;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

// Instância singleton para uso global
let simulationInstance: SimulationEngine | null = null;

export function getSimulation(): SimulationEngine {
  if (!simulationInstance) {
    simulationInstance = new SimulationEngine();
    simulationInstance.initialize();
  }
  return simulationInstance;
}

export function resetSimulation(): SimulationEngine {
  if (simulationInstance) {
    simulationInstance.stop();
  }
  simulationInstance = new SimulationEngine();
  simulationInstance.initialize();
  return simulationInstance;
}
