"use client";

import { create } from "zustand";
import {
  Train,
  TrainState,
  SimulationEvent,
  TrainStateChangedEvent,
  TrainDoorEvent,
  OperatorAlert,
  Line,
  Direction,
  Station,
} from "./types";
import { linhaCentroStations, linhaSulStations, getNextStation } from "./stations";

// Estado da simulação no cliente
interface SimulationStore {
  trains: Train[];
  events: SimulationEvent[];
  alerts: OperatorAlert[];
  speed: number;
  isRunning: boolean;
  isConnected: boolean;

  // Ações
  setTrains: (trains: Train[]) => void;
  updateTrain: (event: TrainStateChangedEvent) => void;
  addEvent: (event: SimulationEvent) => void;
  addAlert: (alert: OperatorAlert) => void;
  clearAlert: (trainId: string) => void;
  setSpeed: (speed: number) => void;
  setIsRunning: (running: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  initialize: () => void;
  tick: () => void;
}

// Cria trens iniciais
function createInitialTrains(): Train[] {
  const trains: Train[] = [];

  // Trem Centro 01 - começa em Camaragibe (ida)
  trains.push({
    id: "train-centro-01",
    name: "Trem Centro 01",
    line: Line.CENTRO,
    state: TrainState.DOORS_OPEN,
    currentStation: linhaCentroStations[0],
    nextStation: linhaCentroStations[1],
    direction: Direction.FORWARD,
    doorAttempts: 0,
    speedMultiplier: 1,
    progress: 0,
    updatedAt: new Date(),
  });

  // Trem Centro 02 - começa em Recife (volta)
  trains.push({
    id: "train-centro-02",
    name: "Trem Centro 02",
    line: Line.CENTRO,
    state: TrainState.DOORS_OPEN,
    currentStation: linhaCentroStations[14],
    nextStation: linhaCentroStations[13],
    direction: Direction.RETURN,
    doorAttempts: 0,
    speedMultiplier: 1,
    progress: 0,
    updatedAt: new Date(),
  });

  // Trem Sul 01 - começa em Jaboatão (ida)
  trains.push({
    id: "train-sul-01",
    name: "Trem Sul 01",
    line: Line.SUL,
    state: TrainState.DOORS_OPEN,
    currentStation: linhaSulStations[0],
    nextStation: linhaSulStations[1],
    direction: Direction.FORWARD,
    doorAttempts: 0,
    speedMultiplier: 1,
    progress: 0,
    updatedAt: new Date(),
  });

  // Trem Sul 02 - começa em Recife (volta)
  trains.push({
    id: "train-sul-02",
    name: "Trem Sul 02",
    line: Line.SUL,
    state: TrainState.DOORS_OPEN,
    currentStation: linhaSulStations[14],
    nextStation: linhaSulStations[13],
    direction: Direction.RETURN,
    doorAttempts: 0,
    speedMultiplier: 1,
    progress: 0,
    updatedAt: new Date(),
  });

  return trains;
}

// Duração de cada estado em ticks
function getStateDuration(state: TrainState): number {
  switch (state) {
    case TrainState.MOVING:
      return 8;
    case TrainState.ARRIVING:
      return 2;
    case TrainState.STOPPED:
      return 1;
    case TrainState.DOORS_OPEN:
      return 4;
    case TrainState.DOORS_CLOSING:
      return 2;
    case TrainState.DOOR_BLOCKED:
      return 2;
    case TrainState.DEPARTING:
      return 1;
    default:
      return 3;
  }
}

// Timers por trem
const trainTimers: Map<string, number> = new Map();

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  trains: [],
  events: [],
  alerts: [],
  speed: 1,
  isRunning: false,
  isConnected: false,

  setTrains: (trains) => set({ trains }),

  updateTrain: (event) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === event.trainId
          ? {
              ...t,
              state: event.state,
              currentStation: event.station,
              nextStation: event.nextStation,
              direction: event.direction,
              progress: event.progress,
              updatedAt: event.timestamp,
            }
          : t
      ),
    })),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events.slice(-99), event],
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [...state.alerts, alert],
    })),

  clearAlert: (trainId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.trainId !== trainId),
    })),

  setSpeed: (speed) => set({ speed }),

  setIsRunning: (running) => set({ isRunning: running }),

  setIsConnected: (connected) => set({ isConnected: connected }),

  initialize: () => {
    const trains = createInitialTrains();
    trains.forEach((train) => {
      trainTimers.set(train.id, getStateDuration(train.state));
    });
    set({ trains, isRunning: true, isConnected: true });
  },

  tick: () => {
    const { trains, speed, addEvent, addAlert } = get();

    const updatedTrains = trains.map((train) => {
      let timer = trainTimers.get(train.id) || 0;
      timer -= speed;

      if (timer > 0) {
        trainTimers.set(train.id, timer);
        
        // Atualiza progresso se em movimento
        if (train.state === TrainState.MOVING) {
          const totalTicks = 8;
          const elapsed = totalTicks - timer;
          const progress = Math.min(100, Math.max(0, (elapsed / totalTicks) * 100));
          return { ...train, progress };
        }
        return train;
      }

      // Transição de estado
      let newTrain = { ...train };
      let newState = train.state;

      switch (train.state) {
        case TrainState.MOVING:
          newState = TrainState.ARRIVING;
          break;

        case TrainState.ARRIVING:
          newState = TrainState.STOPPED;
          addEvent({
            id: crypto.randomUUID(),
            trainId: train.id,
            stationId: train.currentStation.id,
            stationName: train.currentStation.name,
            eventType: "TRAIN_ARRIVED" as any,
            occurredAt: new Date(),
          });
          break;

        case TrainState.STOPPED:
          newState = TrainState.DOORS_OPEN;
          addEvent({
            id: crypto.randomUUID(),
            trainId: train.id,
            stationId: train.currentStation.id,
            stationName: train.currentStation.name,
            eventType: "DOORS_OPENED" as any,
            occurredAt: new Date(),
          });
          break;

        case TrainState.DOORS_OPEN:
          // 10% chance de bloqueio
          if (Math.random() < 0.1) {
            newState = TrainState.DOOR_BLOCKED;
            newTrain.doorAttempts = train.doorAttempts + 1;
            addEvent({
              id: crypto.randomUUID(),
              trainId: train.id,
              stationId: train.currentStation.id,
              stationName: train.currentStation.name,
              eventType: "DOOR_BLOCKED" as any,
              payload: { attempts: newTrain.doorAttempts },
              occurredAt: new Date(),
            });

            if (newTrain.doorAttempts >= 3) {
              addAlert({
                trainId: train.id,
                trainName: train.name,
                alertType: "max_attempts",
                station: train.currentStation,
                message: `Porta bloqueada ${newTrain.doorAttempts} vezes`,
                timestamp: new Date(),
              });
            }
          } else {
            newState = TrainState.DOORS_CLOSING;
          }
          break;

        case TrainState.DOOR_BLOCKED:
          newState = TrainState.DOORS_OPEN;
          addEvent({
            id: crypto.randomUUID(),
            trainId: train.id,
            stationId: train.currentStation.id,
            stationName: train.currentStation.name,
            eventType: "DOOR_UNBLOCKED" as any,
            occurredAt: new Date(),
          });
          break;

        case TrainState.DOORS_CLOSING:
          newState = TrainState.DEPARTING;
          addEvent({
            id: crypto.randomUUID(),
            trainId: train.id,
            stationId: train.currentStation.id,
            stationName: train.currentStation.name,
            eventType: "DOORS_CLOSED" as any,
            occurredAt: new Date(),
          });
          break;

        case TrainState.DEPARTING:
          newState = TrainState.MOVING;
          newTrain.doorAttempts = 0;
          newTrain.progress = 0;

          // Move para próxima estação
          const currentStation = train.currentStation;
          const nextStation = train.nextStation;

          if (nextStation) {
            newTrain.currentStation = nextStation;
            const afterNext = getNextStation(nextStation, train.direction);

            if (!afterNext) {
              // Chegou no terminal, inverte
              newTrain.direction = train.direction === Direction.FORWARD ? Direction.RETURN : Direction.FORWARD;
              newTrain.nextStation = getNextStation(nextStation, newTrain.direction);
            } else {
              newTrain.nextStation = afterNext;
            }
          }

          addEvent({
            id: crypto.randomUUID(),
            trainId: train.id,
            stationId: currentStation.id,
            stationName: currentStation.name,
            eventType: "TRAIN_DEPARTED" as any,
            occurredAt: new Date(),
          });
          break;
      }

      newTrain.state = newState;
      newTrain.updatedAt = new Date();
      trainTimers.set(train.id, getStateDuration(newState));

      return newTrain;
    });

    set({ trains: updatedTrains });
  },
}));

// Ações para manipulação externa
export function blockDoor(trainId: string) {
  const { trains } = useSimulationStore.getState();
  const train = trains.find((t) => t.id === trainId);
  
  if (train && (train.state === TrainState.DOORS_OPEN || train.state === TrainState.DOORS_CLOSING)) {
    useSimulationStore.setState((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId
          ? {
              ...t,
              state: TrainState.DOOR_BLOCKED,
              doorAttempts: t.doorAttempts + 1,
              updatedAt: new Date(),
            }
          : t
      ),
    }));
    trainTimers.set(trainId, getStateDuration(TrainState.DOOR_BLOCKED));
  }
}

export function unblockDoor(trainId: string) {
  const { trains } = useSimulationStore.getState();
  const train = trains.find((t) => t.id === trainId);
  
  if (train && train.state === TrainState.DOOR_BLOCKED) {
    useSimulationStore.setState((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId
          ? {
              ...t,
              state: TrainState.DOORS_OPEN,
              updatedAt: new Date(),
            }
          : t
      ),
    }));
    trainTimers.set(trainId, getStateDuration(TrainState.DOORS_OPEN));
  }
}

export function forceStop(trainId: string) {
  useSimulationStore.setState((state) => ({
    trains: state.trains.map((t) =>
      t.id === trainId
        ? {
            ...t,
            state: TrainState.STOPPED,
            updatedAt: new Date(),
          }
        : t
    ),
  }));
  trainTimers.set(trainId, 999);
}

export function releaseTrain(trainId: string) {
  const { trains, clearAlert } = useSimulationStore.getState();
  const train = trains.find((t) => t.id === trainId);
  
  if (train && (train.state === TrainState.STOPPED || train.state === TrainState.DOOR_BLOCKED)) {
    useSimulationStore.setState((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId
          ? {
              ...t,
              state: TrainState.DOORS_OPEN,
              doorAttempts: 0,
              updatedAt: new Date(),
            }
          : t
      ),
    }));
    trainTimers.set(trainId, getStateDuration(TrainState.DOORS_OPEN));
    clearAlert(trainId);
  }
}
