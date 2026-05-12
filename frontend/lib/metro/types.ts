// Estados do Trem (FSM)
export enum TrainState {
  MOVING = "MOVING",           // Trem se deslocando entre duas estações
  ARRIVING = "ARRIVING",       // Trem desacelerando, a 500m da próxima estação
  STOPPED = "STOPPED",         // Trem parado na plataforma, portas ainda fechadas
  DOORS_OPEN = "DOORS_OPEN",   // Portas abertas, embarque e desembarque em curso
  DOOR_BLOCKED = "DOOR_BLOCKED", // Sensor de porta acionado
  DOORS_CLOSING = "DOORS_CLOSING", // Comando de fechar portas emitido
  DEPARTING = "DEPARTING",     // Portas confirmadas fechadas, aguardando liberação
}

// Linhas do Metrô
export enum Line {
  CENTRO = "centro",  // Linha Vermelha
  SUL = "sul",        // Linha Azul
}

// Direção do Trem
export enum Direction {
  FORWARD = "forward",   // Indo para o terminal final
  RETURN = "return",     // Voltando para o terminal inicial
}

// Tipos de Evento
export enum EventType {
  TRAIN_DEPARTED = "TRAIN_DEPARTED",
  TRAIN_ARRIVED = "TRAIN_ARRIVED",
  DOORS_OPENED = "DOORS_OPENED",
  DOORS_CLOSED = "DOORS_CLOSED",
  DOOR_BLOCKED = "DOOR_BLOCKED",
  DOOR_UNBLOCKED = "DOOR_UNBLOCKED",
  OPERATOR_ALERT = "OPERATOR_ALERT",
  SPEED_CHANGED = "SPEED_CHANGED",
}

// Interface de Estação
export interface Station {
  id: string;
  name: string;
  line: Line;
  orderIndex: number;
  isTerminal: boolean;
  isTransfer: boolean;
  dwellTime: number; // segundos
}

// Interface do Trem
export interface Train {
  id: string;
  name: string;
  line: Line;
  state: TrainState;
  currentStation: Station;
  nextStation: Station | null;
  direction: Direction;
  doorAttempts: number;
  speedMultiplier: number;
  progress: number; // 0-100 progresso entre estações
  updatedAt: Date;
}

// Interface de Evento da Simulação
export interface SimulationEvent {
  id: string;
  trainId: string;
  stationId: string;
  stationName: string;
  eventType: EventType;
  payload?: Record<string, unknown>;
  occurredAt: Date;
}

// Configuração da Simulação
export interface SimulationConfig {
  tickMs: number;
  defaultDwellTime: number;
  doorSensorProbability: number;
  maxDoorAttempts: number;
  doorBlockTimeout: number;
}

// Eventos WebSocket
export interface TrainStateChangedEvent {
  trainId: string;
  trainName: string;
  state: TrainState;
  station: Station;
  nextStation: Station | null;
  direction: Direction;
  progress: number;
  timestamp: Date;
}

export interface TrainDoorEvent {
  trainId: string;
  trainName: string;
  event: "blocked" | "unblocked";
  attempts: number;
  station: Station;
  timestamp: Date;
}

export interface OperatorAlert {
  trainId: string;
  trainName: string;
  alertType: "door_timeout" | "max_attempts" | "emergency";
  station: Station;
  message: string;
  timestamp: Date;
}

export interface SimulationTick {
  timestamp: Date;
  trains: Train[];
}
