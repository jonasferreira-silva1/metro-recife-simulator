import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimulationEvent, EventType } from './events.entity';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(SimulationEvent)
    private readonly eventRepository: Repository<SimulationEvent>,
  ) {}

  /**
   * Persiste um evento da simulação no banco e registra no log de observabilidade.
   */
  async logEvent(
    eventType: EventType,
    trainId?: string,
    stationId?: string,
    payload?: Record<string, unknown>,
  ): Promise<SimulationEvent> {
    const event = this.eventRepository.create({ eventType, trainId, stationId, payload });

    this.logger.log(
      `[${eventType}] Train: ${trainId ?? '-'} | Station: ${stationId ?? '-'}${payload ? ' ' + JSON.stringify(payload) : ''}`,
    );

    return this.eventRepository.save(event);
  }

  async getRecentEvents(limit = 50): Promise<SimulationEvent[]> {
    return this.eventRepository.find({
      order: { occurredAt: 'DESC' },
      take: limit,
    });
  }
}
