// Estados do Trem (FSM) — espelham o backend (state-machine.ts)
export enum TrainState {
  MOVING        = 'MOVING',         // Trem se deslocando entre duas estações
  ARRIVING      = 'ARRIVING',       // Trem desacelerando, a ~500m da próxima estação
  STOPPED       = 'STOPPED',        // Parado na plataforma, portas ainda fechadas
  DOORS_OPEN    = 'DOORS_OPEN',     // Portas abertas, embarque e desembarque em curso
  DOOR_BLOCKED  = 'DOOR_BLOCKED',   // Sensor de porta acionado
  DOORS_CLOSING = 'DOORS_CLOSING',  // Comando de fechar portas emitido
  DEPARTING     = 'DEPARTING',      // Portas confirmadas fechadas, aguardando via livre
}

// Linhas do Metrô do Recife
export enum Line {
  CENTRO = 'centro', // Linha Vermelha
  SUL    = 'sul',    // Linha Azul
}

// Direção de deslocamento do trem
export enum Direction {
  FORWARD = 'forward', // Indo para o terminal final
  RETURN  = 'return',  // Voltando para o terminal inicial
}

// Tipos de evento registrados na simulação
export enum EventType {
  TRAIN_DEPARTED  = 'TRAIN_DEPARTED',
  TRAIN_ARRIVED   = 'TRAIN_ARRIVED',
  DOORS_OPENED    = 'DOORS_OPENED',
  DOORS_CLOSED    = 'DOORS_CLOSED',
  DOOR_BLOCKED    = 'DOOR_BLOCKED',
  DOOR_UNBLOCKED  = 'DOOR_UNBLOCKED',
  OPERATOR_ALERT  = 'OPERATOR_ALERT',
  SPEED_CHANGED   = 'SPEED_CHANGED',
}

export interface Station {
  id: string;
  name: string;
  line: Line;
  orderIndex: number;
  isTerminal: boolean;
  isTransfer: boolean;
  /** Tempo de parada padrão em segundos */
  dwellTime: number;
}

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
  /** Progresso de 0–100 no trecho entre currentStation e nextStation */
  progress: number;
  updatedAt: Date;
}

export interface SimulationEvent {
  id: string;
  trainId: string;
  trainName?: string;
  stationId: string;
  stationName: string;
  eventType: EventType;
  payload?: Record<string, unknown>;
  occurredAt: Date;
}

export interface OperatorAlert {
  trainId: string;
  trainName: string;
  alertType: 'door_timeout' | 'max_attempts' | 'emergency';
  station: Station;
  message: string;
  timestamp: Date;
}
