import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Reward } from './reward.entity';

export enum RedemptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
}

@Entity('redemptions')
export class Redemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'reward_id' })
  rewardId: string;

  @Index('idx_redemptions_user')
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'points_spent', type: 'int' })
  pointsSpent: number;

  @Column({
    type: 'enum',
    enum: RedemptionStatus,
    default: RedemptionStatus.PENDING,
  })
  status: RedemptionStatus;

  @Column({ name: 'idempotency_key', unique: true })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'fulfilled_at', type: 'timestamptz', nullable: true })
  fulfilledAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Reward)
  @JoinColumn({ name: 'reward_id' })
  reward: Reward;
}
