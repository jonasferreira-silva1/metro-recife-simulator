"use client";

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSimulationStore } from '@/lib/metro/simulation-store';
import { linhaCentroStations, linhaSulStations } from '@/lib/metro/stations';

/**
 * Hook customizado responsável pela conexão em Tempo Real com o NestJS (Backend).
 * Ele inicializa a comunicação WebSocket, gerencia os eventos de ciclo de vida (connect/disconnect)
 * e injeta os dados reais direto na Store do Zustand.
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  
  // Pegamos as funções de ação da nossa Store (que foi refatorada)
  const { setTrains, setIsConnected, updateTrain, addEvent, addAlert } = useSimulationStore();

  useEffect(() => {
    // Busca a URL configurada no .env.local (ou cai pro default localhost:3001)
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    
    // Inicia a conexão
    socketRef.current = io(WS_URL, {
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    // 1. EVENTOS DE CICLO DE VIDA
    socket.on('connect', () => {
      console.log('Conectado ao Backend:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do Backend.');
      setIsConnected(false);
    });

    // 2. SNAPSHOT GLOBAL (Disparado a cada 1 segundo pelo Backend)
    // Usado para garantir que a interface exiba os trens em tempo real
    socket.on('simulation:tick', (data: any) => {
      // O backend nos manda um array genérico de trens.
      // Aqui mapeamos as strings de estações para os objetos que o frontend exige.
      const mappedTrains = data.trains.map((t: any) => {
        // Tenta achar o objeto real da estação atual para renderizar o mapa
        const allStations = [...linhaCentroStations, ...linhaSulStations];
        const currentStationObj = allStations.find(s => s.name === t.currentStation);
        const nextStationObj = allStations.find(s => s.name === t.nextStation);

        return {
          ...t,
          currentStation: currentStationObj,
          nextStation: nextStationObj,
          progress: t.state === 'MOVING' ? 50 : 100 // Progresso simulado simples para o mapa visual
        };
      });

      setTrains(mappedTrains);
    });

    // 3. EVENTOS ESPECÍFICOS DE MUDANÇA DE ESTADO
    socket.on('train:state-changed', (payload: any) => {
      updateTrain({
        id: payload.trainId,
        state: payload.state,
        updatedAt: new Date(payload.timestamp),
      });
    });

    socket.on('train:arrived', (payload: any) => {
      const station = [...linhaCentroStations, ...linhaSulStations].find(s => s.id === payload.stationId);
      addEvent({
        id: crypto.randomUUID(),
        trainId: payload.trainId,
        stationId: payload.stationId,
        stationName: station?.name || 'Desconhecida',
        eventType: 'TRAIN_ARRIVED',
        occurredAt: new Date(),
      });
    });

    socket.on('train:departed', (payload: any) => {
      const station = [...linhaCentroStations, ...linhaSulStations].find(s => s.id === payload.fromStationId);
      addEvent({
        id: crypto.randomUUID(),
        trainId: payload.trainId,
        stationId: payload.fromStationId,
        stationName: station?.name || 'Desconhecida',
        eventType: 'TRAIN_DEPARTED',
        occurredAt: new Date(),
      });
    });

    // Limpeza quando o componente for destruído
    return () => {
      socket.disconnect();
    };
  }, [setTrains, setIsConnected, updateTrain, addEvent, addAlert]);

  return { socket: socketRef.current };
}
