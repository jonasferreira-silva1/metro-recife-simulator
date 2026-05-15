import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Station, LineEnum } from '../stations/stations.entity';
import { TrainState } from './state-machine';

export enum DirectionEnum {
  FORWARD = 'forward',
  RETURN = 'return',
}

@Entity('trains')
export class Train {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'enum', enum: LineEnum })
  line: LineEnum;

  @Column({ type: 'enum', enum: TrainState, default: TrainState.STOPPED })
  state: TrainState;

  @ManyToOne(() => Station)
  @JoinColumn({ name: 'current_station_id' })
  currentStation: Station;

  @ManyToOne(() => Station, { nullable: true })
  @JoinColumn({ name: 'next_station_id' })
  nextStation: Station;

  @Column({ type: 'enum', enum: DirectionEnum, default: DirectionEnum.FORWARD })
  direction: DirectionEnum;

  @Column({ name: 'door_attempts', type: 'integer', default: 0 })
  doorAttempts: number;

  @Column({ name: 'speed_multiplier', type: 'float', default: 1.0 })
  speedMultiplier: number;

  @Column({ name: 'time_in_state', type: 'integer', default: 0 })
  timeInState: number; // Ticks spent in current state

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
