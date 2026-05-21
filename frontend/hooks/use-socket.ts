"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { useSimulationStore } from "@/lib/metro/simulation-store";
import { allStations } from "@/lib/metro/stations";
import { setSocket } from "@/lib/metro/socket-client";
import { mapTrainFromSnapshot } from "@/lib/metro/train-position";
import { EventType, OperatorAlert, TrainState } from "@/lib/metro/types";

/**
 * Conecta ao backend NestJS via Socket.io e sincroniza a store Zustand.
 */
export function useSocket() {
  const { setTrains, setIsConnected, updateTrain, addEvent, addAlert } =
    useSimulationStore();

  useEffect(() => {
    const { setIsRunning } = useSimulationStore.getState();

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

    const socket = io(WS_URL, {
      transports: ["websocket"],
    });

    setSocket(socket);

    socket.on("connect", () => {
      console.log("Conectado ao backend:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Desconectado do backend.");
      setIsConnected(false);
    });

    // Estado autoritativo da simulação (pausa/retomada)
    socket.on("simulation:status", (payload: { isRunning: boolean }) => {
      setIsRunning(payload.isRunning);
    });

    // Snapshot autoritativo a cada tick — fonte única para posição no mapa
    socket.on(
      "simulation:tick",
      (data: { trains: Array<Record<string, unknown>> }) => {
        const mappedTrains = data.trains.map((t) => mapTrainFromSnapshot(t));
        setTrains(mappedTrains);
      },
    );

    // Atualização parcial: só estado (posição vem no próximo tick)
    socket.on(
      "train:state-changed",
      (payload: { trainId: string; state: TrainState; timestamp: string }) => {
        updateTrain({
          id: payload.trainId,
          state: payload.state,
          updatedAt: new Date(payload.timestamp),
        });
      },
    );

    socket.on(
      "train:door-event",
      (payload: {
        trainId: string;
        trainName?: string;
        event: "blocked" | "unblocked";
        attempts: number;
        stationId: string;
        stationName: string;
      }) => {
        updateTrain({
          id: payload.trainId,
          doorAttempts: payload.attempts,
          state:
            payload.event === "blocked"
              ? TrainState.DOOR_BLOCKED
              : TrainState.DOORS_OPEN,
        });

        addEvent({
          id: crypto.randomUUID(),
          trainId: payload.trainId,
          trainName: payload.trainName,
          stationId: payload.stationId,
          stationName: payload.stationName,
          eventType:
            payload.event === "blocked"
              ? EventType.DOOR_BLOCKED
              : EventType.DOOR_UNBLOCKED,
          occurredAt: new Date(),
          payload: { attempts: payload.attempts },
        });
      },
    );

    socket.on(
      "operator:alert",
      (payload: {
        trainId: string;
        alertType: OperatorAlert["alertType"];
        stationId: string;
        message: string;
      }) => {
        const train = useSimulationStore
          .getState()
          .trains.find((t) => t.id === payload.trainId);
        const station =
          train?.currentStation ??
          allStations.find((s) => s.id === payload.stationId) ??
          allStations[0];

        addAlert({
          trainId: payload.trainId,
          trainName: train?.name ?? "Trem",
          alertType: payload.alertType,
          station,
          message: payload.message,
          timestamp: new Date(),
        });
      },
    );

    // Usa stationName do payload (autoritativo) — a store ainda pode estar 1 tick atrás
    socket.on(
      "train:arrived",
      (payload: {
        trainId: string;
        trainName: string;
        stationId: string;
        stationName: string;
      }) => {
        addEvent({
          id: crypto.randomUUID(),
          trainId: payload.trainId,
          trainName: payload.trainName,
          stationId: payload.stationId,
          stationName: payload.stationName,
          eventType: EventType.TRAIN_ARRIVED,
          occurredAt: new Date(),
        });
      },
    );

    socket.on(
      "train:departed",
      (payload: {
        trainId: string;
        trainName: string;
        fromStationId: string;
        fromStationName: string;
        toStationName: string;
      }) => {
        addEvent({
          id: crypto.randomUUID(),
          trainId: payload.trainId,
          trainName: payload.trainName,
          stationId: payload.fromStationId,
          stationName: payload.fromStationName,
          eventType: EventType.TRAIN_DEPARTED,
          occurredAt: new Date(),
          payload: { toStationName: payload.toStationName },
        });
      },
    );

    return () => {
      socket.disconnect();
      setSocket(null);
    };
  }, [setTrains, setIsConnected, updateTrain, addEvent, addAlert]);
}
