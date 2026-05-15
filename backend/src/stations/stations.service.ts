import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station, LineEnum } from './stations.entity';

const STATIONS_SEED = [
  // Linha Centro (Vermelha) — Camaragibe → Recife
  { name: 'Camaragibe',        line: LineEnum.CENTRO, orderIndex: 0,  isTerminal: true,  isTransfer: false, dwellTime: 45 },
  { name: 'Cosme e Damião',    line: LineEnum.CENTRO, orderIndex: 1,  isTerminal: false, isTransfer: true,  dwellTime: 30 },
  { name: 'Rodoviária',        line: LineEnum.CENTRO, orderIndex: 2,  isTerminal: false, isTransfer: true,  dwellTime: 35 },
  { name: 'Curado',            line: LineEnum.CENTRO, orderIndex: 3,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Alto do Céu',       line: LineEnum.CENTRO, orderIndex: 4,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Coqueiral',         line: LineEnum.CENTRO, orderIndex: 5,  isTerminal: false, isTransfer: true,  dwellTime: 30 },
  { name: 'Tejipió',           line: LineEnum.CENTRO, orderIndex: 6,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Barro',             line: LineEnum.CENTRO, orderIndex: 7,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Werneck',           line: LineEnum.CENTRO, orderIndex: 8,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Santa Luzia',       line: LineEnum.CENTRO, orderIndex: 9,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Mangueira',         line: LineEnum.CENTRO, orderIndex: 10, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Ipiranga',          line: LineEnum.CENTRO, orderIndex: 11, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Afogados',          line: LineEnum.CENTRO, orderIndex: 12, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Joana Bezerra',     line: LineEnum.CENTRO, orderIndex: 13, isTerminal: false, isTransfer: true,  dwellTime: 35 },
  { name: 'Recife',            line: LineEnum.CENTRO, orderIndex: 14, isTerminal: true,  isTransfer: true,  dwellTime: 60 },

  // Linha Sul (Azul) — Jaboatão → Recife
  { name: 'Jaboatão',              line: LineEnum.SUL, orderIndex: 0,  isTerminal: true,  isTransfer: false, dwellTime: 45 },
  { name: 'Engenho Velho',         line: LineEnum.SUL, orderIndex: 1,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Floriano',              line: LineEnum.SUL, orderIndex: 2,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Cavaleiro',             line: LineEnum.SUL, orderIndex: 3,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Cajueiro Seco',         line: LineEnum.SUL, orderIndex: 4,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Prazeres',              line: LineEnum.SUL, orderIndex: 5,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Monte dos Guararapes',  line: LineEnum.SUL, orderIndex: 6,  isTerminal: false, isTransfer: true,  dwellTime: 35 },
  { name: 'Porta Larga',           line: LineEnum.SUL, orderIndex: 7,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Aeroporto',             line: LineEnum.SUL, orderIndex: 8,  isTerminal: false, isTransfer: true,  dwellTime: 40 },
  { name: 'Tancredo Neves',        line: LineEnum.SUL, orderIndex: 9,  isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Shopping',              line: LineEnum.SUL, orderIndex: 10, isTerminal: false, isTransfer: false, dwellTime: 35 },
  { name: 'Antônio Falcão',        line: LineEnum.SUL, orderIndex: 11, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Imbiribeira',           line: LineEnum.SUL, orderIndex: 12, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { name: 'Largo da Paz',          line: LineEnum.SUL, orderIndex: 13, isTerminal: false, isTransfer: true,  dwellTime: 35 },
  { name: 'Recife',                line: LineEnum.SUL, orderIndex: 14, isTerminal: true,  isTransfer: true,  dwellTime: 60 },
];

@Injectable()
export class StationsService implements OnModuleInit {
  private readonly logger = new Logger(StationsService.name);

  constructor(
    @InjectRepository(Station)
    private readonly stationRepository: Repository<Station>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  private async seed(): Promise<void> {
    const count = await this.stationRepository.count();

    if (count >= 30) {
      this.logger.log('Stations already seeded — skipping.');
      return;
    }

    this.logger.log('Seeding 30 CBTU stations...');

    for (const data of STATIONS_SEED) {
      const exists = await this.stationRepository.findOne({
        where: { name: data.name, line: data.line },
      });

      if (!exists) {
        await this.stationRepository.save(this.stationRepository.create(data));
      }
    }

    this.logger.log('Seed complete — 30 stations inserted.');
  }

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
