import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationsModule } from './stations/stations.module';
import { EventsModule } from './events/events.module';
import { SimulationModule } from './simulation/simulation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // disponível em todos os módulos sem precisar importar novamente
    }),

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
