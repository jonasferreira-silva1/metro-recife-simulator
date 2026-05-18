import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import {
  OperatorAlertPayload,
  SetSpeedPayload,
  SimulationTickTrainSnapshot,
  TrainArrivedPayload,
  TrainCommandPayload,
  TrainDepartedPayload,
  TrainDoorEventPayload,
  TrainStateChangedPayload,
} from './simulation.types';

/**
 * Gateway WebSocket (Socket.io).
 * - Emite eventos da simulação para o frontend
 * - Recebe comandos do operador (Fase 3)
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
  },
})
export class SimulationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SimulationGateway.name);

  constructor(
    @Inject(forwardRef(() => SimulationService))
    private readonly simulationService: SimulationService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // ── Eventos Servidor → Cliente ────────────────────────────────────────────

  emitStateChanged(payload: TrainStateChangedPayload) {
    this.server.emit('train:state-changed', payload);
  }

  emitTrainArrived(payload: TrainArrivedPayload) {
    this.server.emit('train:arrived', payload);
  }

  emitTrainDeparted(payload: TrainDepartedPayload) {
    this.server.emit('train:departed', payload);
  }

  emitTrainDoorEvent(payload: TrainDoorEventPayload) {
    this.server.emit('train:door-event', payload);
  }

  emitOperatorAlert(payload: OperatorAlertPayload) {
    this.server.emit('operator:alert', payload);
  }

  emitSimulationTick(payload: { timestamp: string; trains: SimulationTickTrainSnapshot[] }) {
    this.server.emit('simulation:tick', payload);
  }

  // ── Eventos Cliente → Servidor (Fase 3) ───────────────────────────────────

  @SubscribeMessage('door:block')
  async handleDoorBlock(@MessageBody() body: TrainCommandPayload) {
    await this.simulationService.blockDoor(body.trainId);
    return { ok: true };
  }

  @SubscribeMessage('door:unblock')
  async handleDoorUnblock(@MessageBody() body: TrainCommandPayload) {
    await this.simulationService.unblockDoor(body.trainId);
    return { ok: true };
  }

  @SubscribeMessage('operator:force-stop')
  async handleForceStop(@MessageBody() body: TrainCommandPayload) {
    await this.simulationService.forceStop(body.trainId);
    return { ok: true };
  }

  @SubscribeMessage('operator:release')
  async handleRelease(@MessageBody() body: TrainCommandPayload) {
    await this.simulationService.releaseTrain(body.trainId);
    return { ok: true };
  }

  @SubscribeMessage('simulation:set-speed')
  async handleSetSpeed(@MessageBody() body: SetSpeedPayload) {
    await this.simulationService.setSimulationSpeed(body.multiplier);
    return { ok: true, multiplier: body.multiplier };
  }
}
