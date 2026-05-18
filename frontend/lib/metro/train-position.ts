import { Train, TrainState } from "./types";
import { resolveStationOnLine } from "./stations";

/** Mesmos valores base da FSM no backend (state-machine.ts) */
const MOVING_TICKS_BASE = 15;
const ARRIVING_TICKS_BASE = 3;

/**
 * Calcula o progresso (0–100) no trecho entre currentStation e nextStation.
 * MOVING cobre ~92% do trajeto visual; ARRIVING os últimos ~8%.
 */
export function computeSegmentProgress(
  state: TrainState,
  timeInState: number,
  speedMultiplier: number,
): number {
  const ticks = (base: number) => Math.max(1, Math.round(base / speedMultiplier));

  if (state === TrainState.MOVING) {
    return Math.min(92, (timeInState / ticks(MOVING_TICKS_BASE)) * 92);
  }
  if (state === TrainState.ARRIVING) {
    return 92 + Math.min(8, (timeInState / ticks(ARRIVING_TICKS_BASE)) * 8);
  }
  return 0;
}

/**
 * Posição contínua no mapa (0 = primeira estação, 14 = última).
 * Interpola sempre entre origem (current) e destino (next) — nunca “volta” no meio do trecho.
 */
export function getMapPosition(train: Train): number {
  const fromIdx = train.currentStation.orderIndex;
  const inTransit =
    (train.state === TrainState.MOVING || train.state === TrainState.ARRIVING) &&
    train.nextStation != null;

  if (inTransit && train.nextStation) {
    const toIdx = train.nextStation.orderIndex;
    const t = Math.min(1, Math.max(0, train.progress / 100));
    return fromIdx + (toIdx - fromIdx) * t;
  }

  return fromIdx;
}

/** Converte o snapshot do WebSocket em um Train para a UI */
export function mapTrainFromSnapshot(raw: Record<string, unknown>): Train {
  const line = raw.line as Train["line"];
  const state = raw.state as TrainState;
  const timeInState = (raw.timeInState as number) ?? 0;
  const speedMultiplier = (raw.speedMultiplier as number) ?? 1;

  const currentStation = resolveStationOnLine(
    line,
    raw.currentStation as string | null,
    raw.currentStationOrder as number | undefined,
  );

  const nextStation =
    raw.nextStationOrder != null || raw.nextStation
      ? resolveStationOnLine(
          line,
          raw.nextStation as string | null,
          raw.nextStationOrder as number | undefined,
        )
      : null;

  return {
    id: raw.id as string,
    name: raw.name as string,
    line,
    state,
    currentStation,
    nextStation,
    direction: raw.direction as Train["direction"],
    doorAttempts: (raw.doorAttempts as number) ?? 0,
    speedMultiplier,
    progress: computeSegmentProgress(state, timeInState, speedMultiplier),
    updatedAt: new Date(),
  };
}
