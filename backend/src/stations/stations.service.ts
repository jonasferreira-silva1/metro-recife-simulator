import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station, LineEnum } from './stations.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private readonly stationRepository: Repository<Station>,
  ) {}

  async findAll(): Promise<Station[]> {
    return this.stationRepository.find({
      order: { line: 'ASC', orderIndex: 'ASC' },
    });
  }

  async findByLine(line: LineEnum): Promise<Station[]> {
    return this.stationRepository.find({
      where: { line },
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: string): Promise<Station | null> {
    return this.stationRepository.findOne({ where: { id } });
  }
}
