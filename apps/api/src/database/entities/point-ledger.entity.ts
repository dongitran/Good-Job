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

export enum LedgerType {
  GIVE = 'give',
  RECEIVE = 'receive',
  REDEEM = 'redeem',
  BUDGET_RESET = 'reset',
}

export enum BalanceType {
  GIVEABLE = 'giveable',
  REDEEMABLE = 'redeemable',
}

@Entity('point_ledger')
@Index('idx_ledger_user_type', ['userId', 'balanceType'])
export class PointLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: LedgerType })
  type: LedgerType;

  @Column({ type: 'int' })
  amount: number;

  @Column({ name: 'balance_type', type: 'enum', enum: BalanceType })
  balanceType: BalanceType;

  @Column({ name: 'reference_type', nullable: true })
  referenceType: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
