import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationsModule } from './stations/stations.module';
import { EventsModule } from './events/events.module';
import { SimulationModule } from './simulation/simulation.module';

const dbLogger = new Logger('TypeORM');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        const useSSL = config.get<string>('DB_SSL') === 'true';
        dbLogger.log(`Conectando em: ${url?.replace(/:[^:@]+@/, ':***@')} (SSL: ${useSSL})`); // intentional log
        return {
          type: 'postgres',
          url,
          autoLoadEntities: true,
          synchronize: true,
          ssl: useSSL ? { rejectUnauthorized: false } : false,
          retryAttempts: 10,
          retryDelay: 3000,
          connectTimeoutMS: 15000,
        };
      },
    }),

    StationsModule,
    EventsModule,
    SimulationModule,
  ],
})
export class AppModule {}
