import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationsModule } from './stations/stations.module';
import { EventsModule } from './events/events.module';
import { SimulationModule } from './simulation/simulation.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
      retryAttempts: 5,
      retryDelay: 3000,
      connectTimeoutMS: 10000,
    }),

    StationsModule,
    EventsModule,
    SimulationModule,
  ],
})
export class AppModule {}
