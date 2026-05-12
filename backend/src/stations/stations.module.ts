import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Station } from './stations.entity';
import { StationsService } from './stations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Station])],
  providers: [StationsService],
  exports: [StationsService],
})
export class StationsModule {}
