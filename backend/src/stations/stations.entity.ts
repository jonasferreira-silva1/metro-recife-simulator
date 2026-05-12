import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum LineEnum {
  CENTRO = 'centro',
  SUL = 'sul',
}

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: LineEnum })
  line: LineEnum;

  @Column({ name: 'order_index', type: 'integer' })
  orderIndex: number;

  @Column({ name: 'is_terminal', type: 'boolean', default: false })
  isTerminal: boolean;

  @Column({ name: 'is_transfer', type: 'boolean', default: false })
  isTransfer: boolean;

  @Column({ name: 'dwell_time', type: 'integer', default: 30 })
  dwellTime: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
