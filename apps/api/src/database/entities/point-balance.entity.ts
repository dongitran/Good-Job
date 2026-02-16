import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { PointTransaction } from './point-transaction.entity';

export enum BalanceType {
  GIVEABLE = 'giveable',
  REDEEMABLE = 'redeemable',
}

/**
 * Payment-Grade Balance Management
 *
 * This table provides O(1) balance lookups instead of SUM() on transactions.
 * - Fast queries: SELECT current_balance WHERE user_id AND balance_type
 * - Efficient locking: Lock single row instead of all transactions
 * - Source of truth: point_transactions (this is materialized cache)
 *
 * Each user has 2 rows: one for 'giveable', one for 'redeemable'
 */
@Entity('point_balances')
@Index('idx_point_balance_pk', ['userId', 'balanceType'], { unique: true })
export class PointBalance {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'balance_type', type: 'enum', enum: BalanceType })
  balanceType: BalanceType;

  @Column({ name: 'current_balance', type: 'int', default: 0 })
  currentBalance: number;

  @Column({ name: 'last_transaction_id', type: 'uuid', nullable: true })
  lastTransactionId: string;

  /**
   * Optimistic locking: Increments on each update
   * Prevents race conditions during concurrent balance updates
   */
  @Column({ type: 'int', default: 0 })
  version: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => PointTransaction)
  @JoinColumn({ name: 'last_transaction_id' })
  lastTransaction: PointTransaction;
}
