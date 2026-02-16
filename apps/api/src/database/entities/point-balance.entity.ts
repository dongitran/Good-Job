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
import { PointTransactionEntry } from './point-transaction-entry.entity';
import { BalanceType } from './enums';

/**
 * Payment-Grade Balance Management (Materialized Cache)
 *
 * This table provides O(1) balance lookups instead of SUM() on entries.
 * - Fast queries: SELECT current_balance WHERE user_id AND balance_type
 * - Efficient locking: Lock single row instead of all entries
 * - Source of truth: point_transaction_entries (this is materialized cache)
 *
 * Each user has 2 rows: one for 'giveable', one for 'redeemable'
 *
 * Balance Update Process:
 * 1. Insert transaction + entries (atomic)
 * 2. Update point_balances (atomic with transaction)
 * 3. Set last_entry_id to track last processed entry
 * 4. Increment version for optimistic locking
 *
 * Reconciliation:
 * - Daily job: Verify current_balance = SUM(point_transaction_entries.amount)
 * - On drift: Rebuild from point_transaction_entries (trust the ledger)
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

  /**
   * Last processed entry ID (from point_transaction_entries)
   * Used for reconciliation and incremental balance updates
   */
  @Column({ name: 'last_entry_id', type: 'uuid', nullable: true })
  lastEntryId: string;

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

  @ManyToOne(() => PointTransactionEntry)
  @JoinColumn({ name: 'last_entry_id' })
  lastEntry: PointTransactionEntry;
}
