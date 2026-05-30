import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationsModule } from './stations/stations.module';
import { EventsModule } from './events/events.module';
import { SimulationModule } from './simulation/simulation.module';

const dbLogger = new Logger('TypeORM');

@Module({
  imports: [
    // Torna as variáveis de ambiente disponíveis globalmente via ConfigService
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        const useSSL = config.get<string>('DB_SSL') === 'true';

        // Loga a URL mascarando a senha para não expor credenciais nos logs
        dbLogger.log(
          `Conectando em: ${url?.replace(/:[^:@]+@/, ':***@')} (SSL: ${useSSL})`,
        );

        return {
          type: 'postgres',
          url,
          autoLoadEntities: true,
          // synchronize: true só é seguro em desenvolvimento; em produção use migrations
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
