import { TrainState } from "./types";

// Transições válidas da Máquina de Estados Finitos
const validTransitions: Record<TrainState, TrainState[]> = {
  [TrainState.MOVING]: [TrainState.ARRIVING],
  [TrainState.ARRIVING]: [TrainState.STOPPED],
  [TrainState.STOPPED]: [TrainState.DOORS_OPEN],
  [TrainState.DOORS_OPEN]: [TrainState.DOORS_CLOSING, TrainState.DOOR_BLOCKED],
  [TrainState.DOOR_BLOCKED]: [TrainState.DOORS_OPEN],
  [TrainState.DOORS_CLOSING]: [TrainState.DEPARTING, TrainState.DOOR_BLOCKED],
  [TrainState.DEPARTING]: [TrainState.MOVING],
};

// Verifica se uma transição é válida
export function isValidTransition(from: TrainState, to: TrainState): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}

// Realiza a transição se for válida
export function transition(from: TrainState, to: TrainState): TrainState {
  if (!isValidTransition(from, to)) {
    throw new Error(`Transição inválida: ${from} -> ${to}`);
  }
  return to;
}

// Obtém os próximos estados possíveis
export function getNextPossibleStates(state: TrainState): TrainState[] {
  return validTransitions[state] || [];
}

// Verifica se o trem está em um estado de parada
export function isStationaryState(state: TrainState): boolean {
  return [
    TrainState.STOPPED,
    TrainState.DOORS_OPEN,
    TrainState.DOOR_BLOCKED,
    TrainState.DOORS_CLOSING,
  ].includes(state);
}

// Verifica se o trem está em movimento
export function isMovingState(state: TrainState): boolean {
  return [TrainState.MOVING, TrainState.ARRIVING, TrainState.DEPARTING].includes(state);
}

// Tempo padrão em cada estado (em ticks)
export function getDefaultStateDuration(state: TrainState, dwellTime: number): number {
  switch (state) {
    case TrainState.MOVING:
      return 15; // ~15 segundos entre estações (será ajustado pelo progresso)
    case TrainState.ARRIVING:
      return 3; // 3 segundos desacelerando
    case TrainState.STOPPED:
      return 2; // 2 segundos parado antes de abrir portas
    case TrainState.DOORS_OPEN:
      return Math.floor(dwellTime / 2); // Metade do tempo de parada
    case TrainState.DOORS_CLOSING:
      return 3; // 3 segundos fechando portas
    case TrainState.DOOR_BLOCKED:
      return 2; // 2 segundos antes de reabrir
    case TrainState.DEPARTING:
      return 2; // 2 segundos antes de partir
    default:
      return 5;
  }
}
