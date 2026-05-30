'use client';

import { create } from 'zustand';
import { Train, SimulationEvent, OperatorAlert } from './types';
import { emitCommand } from './socket-client';

/**
 * Store global da simulação no frontend.
 * É um espelho passivo do estado do backend — só é atualizado via WebSocket.
 * Comandos do operador são enviados ao NestJS e o estado retorna pelo próximo tick.
 */
interface SimulationStore {
  trains: Train[];
  events: SimulationEvent[];
  alerts: OperatorAlert[];
  speed: number;
  isConnected: boolean;
  isRunning: boolean;

  setTrains: (trains: Train[]) => void;
  updateTrain: (train: Partial<Train> & { id: string }) => void;
  addEvent: (event: SimulationEvent) => void;
  addAlert: (alert: OperatorAlert) => void;
  clearAlert: (trainId: string) => void;
  setSpeed: (speed: number) => void;
  setIsConnected: (connected: boolean) => void;
  setIsRunning: (running: boolean) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  trains: [],
  events: [],
  alerts: [],
  speed: 1,
  isConnected: false,
  isRunning: true,

  setTrains: (trains) => set({ trains }),

  updateTrain: (updatedData) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === updatedData.id ? { ...t, ...updatedData } : t,
      ),
    })),

  // Mantém no máximo 100 eventos para não crescer indefinidamente
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100),
    })),

  // Evita alertas duplicados para o mesmo trem no mesmo incidente
  addAlert: (alert) =>
    set((state) => {
      if (state.alerts.some((a) => a.trainId === alert.trainId)) return state;
      return { alerts: [...state.alerts, alert] };
    }),

  clearAlert: (trainId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.trainId !== trainId),
    })),

  setSpeed: (speed) => set({ speed }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setIsRunning: (running) => set({ isRunning: running }),
}));

// ── Comandos do operador → Backend (contrato docs/06-websocket.md) ─────────

/** Aciona o sensor de porta manualmente */
export function blockDoor(trainId: string) {
  emitCommand('door:block', { trainId });
}

/** Remove a obstrução detectada pelo sensor */
export function unblockDoor(trainId: string) {
  emitCommand('door:unblock', { trainId });
}

/** Parada de emergência com trem em movimento */
export function forceStop(trainId: string) {
  emitCommand('operator:force-stop', { trainId });
}

/** Libera o trem após intervenção do operador e limpa o alerta local */
export function releaseTrain(trainId: string) {
  emitCommand('operator:release', { trainId });
  useSimulationStore.getState().clearAlert(trainId);
}

/** Altera a velocidade global da simulação (1x, 2x, 5x, 10x) */
export function setSimulationSpeed(multiplier: number) {
  const allowed = [1, 2, 5, 10] as const;
  if (!allowed.includes(multiplier as (typeof allowed)[number])) return;
  useSimulationStore.getState().setSpeed(multiplier);
  emitCommand('simulation:set-speed', { multiplier });
}
