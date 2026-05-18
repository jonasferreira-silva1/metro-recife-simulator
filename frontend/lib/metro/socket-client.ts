"use client";

import type { Socket } from "socket.io-client";

/**
 * Referência global ao socket criado pelo hook useSocket.
 * Permite que ações do operador (simulation-store) emitam comandos
 * sem precisar passar o socket por props em toda a árvore de componentes.
 */
let socketInstance: Socket | null = null;

export function setSocket(socket: Socket | null) {
  socketInstance = socket;
}

export function getSocket(): Socket | null {
  return socketInstance;
}

/** Emite comando apenas se o socket estiver conectado */
export function emitCommand(event: string, payload: object): boolean {
  if (!socketInstance?.connected) {
    console.warn(`[WS] Não conectado — comando "${event}" ignorado.`);
    return false;
  }
  socketInstance.emit(event, payload);
  return true;
}
