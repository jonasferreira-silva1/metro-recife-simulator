import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, Inject, forwardRef } from "@nestjs/common";
import { SimulationService } from "./simulation.service";
import {
  OperatorAlertPayload,
  SetSpeedPayload,
  SimulationTickTrainSnapshot,
  TrainArrivedPayload,
  TrainCommandPayload,
  TrainDepartedPayload,
  TrainDoorEventPayload,
  TrainStateChangedPayload,
} from "./simulation.types";

/**
 * Gateway WebSocket (Socket.io).
 * - Emite eventos da simulação para o frontend
 * - Recebe comandos do operador (Fase 3)
 *
 * CORS é configurado via afterInit para garantir que process.env já foi carregado.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: false,
  },
})
export class SimulationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SimulationGateway.name);

  constructor(
    @Inject(forwardRef(() => SimulationService))
    private readonly simulationService: SimulationService,
  ) {}

  afterInit(server: Server) {
    // Reconfigura CORS em runtime, após as variáveis de ambiente serem carregadas
    const allowedOrigins = (process.env.FRONTEND_URL || '*')
      .split(',')
      .map((o) => o.trim());

    server.engine.on('headers', (headers: Record<string, string>, req: { headers: { origin?: string } }) => {
      const origin = req.headers.origin;
      if (!origin) return;
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Access-Control-Allow-Credentials'] = 'true';
      }
    });

    this.logger.log(`WebSocket Gateway iniciado. CORS: ${allowedOrigins.join(', ')}`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    // Envia estado atual da simulação ao novo cliente (pausa/retomada)
    client.emit("simulation:status", {
      isRunning: this.simulationService.isSimulationRunning(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // ── Eventos Servidor → Cliente ────────────────────────────────────────────

  emitStateChanged(payload: TrainStateChangedPayload) {
    this.server.emit("train:state-changed", payload);
  }

  emitTrainArrived(payload: TrainArrivedPayload) {
    this.server.emit("train:arrived", payload);
  }

  emitTrainDeparted(payload: TrainDepartedPayload) {
    this.server.emit("train:departed", payload);
  }

  emitTrainDoorEvent(payload: TrainDoorEventPayload) {
    this.server.emit("train:door-event", payload);
  }

  emitOperatorAlert(payload: OperatorAlertPayload) {
    this.server.emit("operator:alert", payload);
  }

  emitSimulationTick(payload: {
    timestamp: string;
    trains: SimulationTickTrainSnapshot[];
    isRunning: boolean;
  }) {
    this.server.emit("simulation:tick", payload);
  }

  emitSimulationStatus(payload: { isRunning: boolean }) {
    this.server.emit("simulation:status", payload);
  }

  // ── Eventos Cliente → Servidor (Fase 3) ───────────────────────────────────

  @SubscribeMessage("door:block")
  async handleDoorBlock(@MessageBody() body: TrainCommandPayload) {
    await this.simulationService.blockDoor(body.trainId);
    return { ok: true };
  }

  @SubscribeMessage("door:unblock")
  async handleDoorUnblock(@MessageBody() body: TrainCommandPayload) {
    await this.simulationService.unblockDoor(body.trainId);
    return { ok: true };
  }

  @SubscribeMessage("operator:force-stop")
  async handleForceStop(@MessageBody() body: TrainCommandPayload) {
    await this.simulationService.forceStop(body.trainId);
    return { ok: true };
  }

  @SubscribeMessage("operator:release")
  async handleRelease(@MessageBody() body: TrainCommandPayload) {
    await this.simulationService.releaseTrain(body.trainId);
    return { ok: true };
  }

  @SubscribeMessage("simulation:set-speed")
  async handleSetSpeed(@MessageBody() body: SetSpeedPayload) {
    await this.simulationService.setSimulationSpeed(body.multiplier);
    return { ok: true, multiplier: body.multiplier };
  }

  @SubscribeMessage("simulation:pause")
  handlePause() {
    this.simulationService.pauseSimulation();
    return { ok: true, isRunning: false };
  }

  @SubscribeMessage("simulation:resume")
  handleResume() {
    this.simulationService.resumeSimulation();
    return { ok: true, isRunning: true };
  }

  @SubscribeMessage("simulation:toggle-pause")
  handleTogglePause() {
    const isRunning = this.simulationService.toggleSimulationPause();
    return { ok: true, isRunning };
  }
}
