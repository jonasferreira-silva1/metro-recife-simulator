import { TrainState } from './state-machine';

/** Payloads do contrato WebSocket (docs/06-websocket.md) */

export interface TrainStateChangedPayload {
  trainId: string;
  state: TrainState;
  stationId: string;
  timestamp: string;
}

export interface TrainArrivedPayload {
  trainId: string;
  trainName: string;
  line: string;
  stationId: string;
  stationName: string;
  dwellTime: number;
}

export interface TrainDepartedPayload {
  trainId: string;
  trainName: string;
  line: string;
  fromStationId: string;
  fromStationName: string;
  toStationId: string;
  toStationName: string;
}

export interface TrainDoorEventPayload {
  trainId: string;
  trainName: string;
  line: string;
  event: 'blocked' | 'unblocked';
  attempts: number;
  stationId: string;
  stationName: string;
}

export interface OperatorAlertPayload {
  trainId: string;
  alertType: 'door_timeout' | 'max_attempts' | 'emergency';
  stationId: string;
  message: string;
}

export interface SimulationTickTrainSnapshot {
  id: string;
  name: string;
  line: string;
  state: TrainState;
  currentStation: string | null;
  nextStation: string | null;
  /** Índice na linha (0–14) — evita ambiguidade com "Recife" nas duas linhas */
  currentStationOrder: number;
  nextStationOrder: number | null;
  direction: string;
  doorAttempts: number;
  speedMultiplier: number;
  timeInState: number;
}

export interface SetSpeedPayload {
  multiplier: 1 | 2 | 5 | 10;
}

export interface TrainCommandPayload {
  trainId: string;
}
