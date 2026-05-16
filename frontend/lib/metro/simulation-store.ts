"use client";

import { create } from "zustand";
import { Train, SimulationEvent, OperatorAlert } from "./types";

/**
 * Estado Global da Simulação no Frontend.
 * Na Fase 1 e 2, removemos o "mock" local. Agora este store funciona apenas
 * como um espelho passivo: ele recebe as informações via WebSocket e
 * atualiza a tela do usuário de forma reativa.
 */
interface SimulationStore {
  trains: Train[];
  events: SimulationEvent[];
  alerts: OperatorAlert[];
  speed: number;
  isConnected: boolean;

  // Ações de Atualização (Chamadas pelo Hook do WebSocket)
  setTrains: (trains: Train[]) => void;
  updateTrain: (train: Partial<Train> & { id: string }) => void;
  addEvent: (event: SimulationEvent) => void;
  addAlert: (alert: OperatorAlert) => void;
  clearAlert: (trainId: string) => void;
  setSpeed: (speed: number) => void;
  setIsConnected: (connected: boolean) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  trains: [],
  events: [],
  alerts: [],
  speed: 1, // Mantido para enviar o multiplicador ao backend no futuro
  isConnected: false,

  /**
   * Substitui a lista inteira de trens. Geralmente chamado pelo evento 'simulation:tick'
   */
  setTrains: (trains) => set({ trains }),

  /**
   * Atualiza parcialmente os dados de um único trem (usado no 'train:state-changed')
   */
  updateTrain: (updatedData) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === updatedData.id ? { ...t, ...updatedData } : t
      ),
    })),

  /**
   * Adiciona um novo evento no Log (ex: Porta abriu, trem partiu).
   * Mantém apenas os últimos 100 eventos para não pesar a memória do navegador.
   */
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100),
    })),

  /**
   * Adiciona um alerta para o Painel do Operador (ex: Porta bloqueada 3x)
   */
  addAlert: (alert) =>
    set((state) => ({
      alerts: [...state.alerts, alert],
    })),

  /**
   * Limpa os alertas de um trem específico após a intervenção manual
   */
  clearAlert: (trainId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.trainId !== trainId),
    })),

  /**
   * Atualiza a velocidade da simulação selecionada no frontend
   */
  setSpeed: (speed) => set({ speed }),

  /**
   * Status de conexão do WebSocket para feedback visual
   */
  setIsConnected: (connected) => set({ isConnected: connected }),
}));

// ==========================================
// AÇÕES DO OPERADOR (Fase 3 - Preparação)
// Como o motor agora é no backend, estas funções apenas avisam o operador.
// Na próxima fase (3), elas vão enviar um comando (emit) via WebSocket para o NestJS.
// ==========================================

export function blockDoor(trainId: string) {
  console.log(`[Fase 3 TODO]: Emitir comando para bloquear porta do trem ${trainId} via WS`);
  alert('Comando desativado temporariamente. Na Fase 3, isso vai enviar um evento WebSocket pro Backend!');
}

export function unblockDoor(trainId: string) {
  console.log(`[Fase 3 TODO]: Emitir comando para desbloquear porta do trem ${trainId} via WS`);
}

export function forceStop(trainId: string) {
  console.log(`[Fase 3 TODO]: Emitir comando para forçar parada do trem ${trainId} via WS`);
  alert('Comando desativado. Aguarde a Fase 3!');
}

export function releaseTrain(trainId: string) {
  console.log(`[Fase 3 TODO]: Emitir comando para liberar trem ${trainId} via WS`);
  const { clearAlert } = useSimulationStore.getState();
  clearAlert(trainId); // Limpamos visualmente o alerta na UI
}
