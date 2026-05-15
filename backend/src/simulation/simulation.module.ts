import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimulationService } from './simulation.service';
import { SimulationGateway } from './simulation.gateway';
import { SimulationController } from './simulation.controller';
import { Train } from './train.entity';
import { StationsModule } from '../stations/stations.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Train]),
    StationsModule,
    EventsModule,
  ],
  providers: [SimulationService, SimulationGateway],
  controllers: [SimulationController],
})
export class SimulationModule {}
