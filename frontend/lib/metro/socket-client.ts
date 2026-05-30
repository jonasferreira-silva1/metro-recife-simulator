'use client';

import type { Socket } from 'socket.io-client';

/**
 * Referência global ao socket criado pelo hook useSocket.
 * Centraliza o acesso ao socket para que a simulation-store possa
 * emitir comandos sem precisar receber o socket por props.
 */
let socketInstance: Socket | null = null;

export function setSocket(socket: Socket | null) {
  socketInstance = socket;
}

/**
 * Emite um comando para o backend apenas se o socket estiver conectado.
 * Retorna false e loga um aviso caso a conexão esteja ausente.
 */
export function emitCommand(event: string, payload: object): boolean {
  if (!socketInstance?.connected) {
    console.warn(`[WS] Não conectado — comando "${event}" ignorado.`);
    return false;
  }
  socketInstance.emit(event, payload);
  return true;
}
