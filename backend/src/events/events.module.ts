import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimulationEvent } from './events.entity';
import { EventsService } from './events.service';

@Module({
  imports: [TypeOrmModule.forFeature([SimulationEvent])],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
