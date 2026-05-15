import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TrainState } from './state-machine';

/**
 * WebSocket Gateway do NestJS.
 * É responsável por abrir uma porta WebSocket (Socket.io) e permitir
 * que o Frontend (Next.js) se conecte e ouça as mudanças de estado dos trens.
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Permite conexão de qualquer frontend
  },
})
export class SimulationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SimulationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ==========================================
  // MÉTODOS DE EMISSÃO (Do Servidor para o Cliente)
  // O Frontend deve usar socket.on('nome-do-evento', ...) para ouvir essas funções
  // ==========================================

  /**
   * Disparado sempre que o estado da FSM do trem muda.
   */
  emitStateChanged(payload: { trainId: string; state: TrainState; stationId: string; timestamp: string }) {
    this.server.emit('train:state-changed', payload);
  }

  /**
   * Disparado quando o trem para de fato na plataforma da estação.
   */
  emitTrainArrived(payload: { trainId: string; stationId: string; dwellTime: number }) {
    this.server.emit('train:arrived', payload);
  }

  /**
   * Disparado quando as portas fecham e o trem sai da estação.
   */
  emitTrainDeparted(payload: { trainId: string; fromStationId: string; toStationId: string }) {
    this.server.emit('train:departed', payload);
  }

  /**
   * Snapshot global contendo a localização de todos os trens.
   * Disparado a cada 1 segundo.
   */
  emitSimulationTick(payload: { timestamp: string; trains: any[] }) {
    this.server.emit('simulation:tick', payload);
  }
}
