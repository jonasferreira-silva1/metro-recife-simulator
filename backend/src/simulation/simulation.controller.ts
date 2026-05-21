import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SimulationService } from './simulation.service';

/**
 * API REST complementar ao WebSocket.
 * Útil para testes manuais (Postman/curl) sem abrir o painel.
 */
@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'metro-recife-simulator',
      simulationRunning: this.simulationService.isSimulationRunning(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  async getStatus() {
    return {
      ...(await this.simulationService.getStatus()),
      simulationRunning: this.simulationService.isSimulationRunning(),
    };
  }

  @Get('events')
  async getEvents() {
    return this.simulationService.getRecentEvents(100);
  }

  @Post('pause')
  pause() {
    this.simulationService.pauseSimulation();
    return { ok: true, isRunning: false };
  }

  @Post('resume')
  resume() {
    this.simulationService.resumeSimulation();
    return { ok: true, isRunning: true };
  }

  @Post(':trainId/door-event')
  async doorEvent(
    @Param('trainId') trainId: string,
    @Body() body: { action: 'block' | 'unblock' },
  ) {
    if (body.action === 'block') {
      await this.simulationService.blockDoor(trainId);
    } else {
      await this.simulationService.unblockDoor(trainId);
    }
    return { ok: true, action: body.action };
  }

  @Post(':trainId/force-stop')
  async forceStop(@Param('trainId') trainId: string) {
    await this.simulationService.forceStop(trainId);
    return { ok: true };
  }

  @Post(':trainId/release')
  async release(@Param('trainId') trainId: string) {
    await this.simulationService.releaseTrain(trainId);
    return { ok: true };
  }
}
