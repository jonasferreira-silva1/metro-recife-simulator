import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum EventType {
  TRAIN_DEPARTED = 'TRAIN_DEPARTED',
  TRAIN_ARRIVED = 'TRAIN_ARRIVED',
  DOORS_OPENED = 'DOORS_OPENED',
  DOORS_CLOSED = 'DOORS_CLOSED',
  DOOR_BLOCKED = 'DOOR_BLOCKED',
  DOOR_UNBLOCKED = 'DOOR_UNBLOCKED',
  OPERATOR_ALERT = 'OPERATOR_ALERT',
  SPEED_CHANGED = 'SPEED_CHANGED',
}

@Entity('simulation_events')
export class SimulationEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'train_id', type: 'uuid', nullable: true })
  trainId: string;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId: string;

  @Column({ name: 'event_type', type: 'enum', enum: EventType })
  eventType: EventType;

  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
