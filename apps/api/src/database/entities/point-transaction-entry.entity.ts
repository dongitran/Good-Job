import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeUpdate,
  BeforeRemove,
} from 'typeorm';
import { PointTransaction } from './point-transaction.entity';
import { User } from './user.entity';
import { AccountType } from './enums';

/**
 * DOUBLE-ENTRY BOOKKEEPING - JOURNAL LINES
 *
 * This table stores the individual entries (journal lines) for each transaction.
 * Implements true double-entry bookkeeping:
 * - Every transaction has 2+ entries
 * - Entries MUST balance (SUM(amount) = 0 per transaction)
 * - Immutable audit trail (no updates/deletes)
 *
 * ⚠️ CRITICAL CONSTRAINT (Zero-Sum Rule):
 * For each transaction_id, SUM(amount) MUST equal 0
 * This is enforced by database constraint and application logic
 *
 * Account Types (Following Accounting Principles):
 * - ASSET ACCOUNTS (user-owned):
 *   - giveable: User's monthly giving budget
 *   - redeemable: User's earned points
 * - LIABILITY ACCOUNTS (system owes):
 *   - system_liability: Pending redemptions
 * - EQUITY ACCOUNTS (system owns):
 *   - system_equity: Budget allocations
 *
 * Amount Convention:
 * - Positive = Debit (increase asset/decrease liability)
 * - Negative = Credit (decrease asset/increase liability)
 *
 * Example 1: Recognition (A gives 50 points to B)
 * [
 *   { transaction_id: tx_1, user_id: A, account_type: giveable,   amount: -50 },
 *   { transaction_id: tx_1, user_id: B, account_type: redeemable, amount: +50 }
 * ]
 * SUM = -50 + 50 = 0 ✓
 *
 * Example 2: Redemption (B spends 500 points)
 * [
 *   { transaction_id: tx_2, user_id: B,    account_type: redeemable,       amount: -500 },
 *   { transaction_id: tx_2, user_id: null, account_type: system_liability, amount: +500 }
 * ]
 * SUM = -500 + 500 = 0 ✓
 *
 * Example 3: Budget Allocation (A gets 200 monthly points)
 * [
 *   { transaction_id: tx_3, user_id: A,    account_type: giveable,      amount: +200 },
 *   { transaction_id: tx_3, user_id: null, account_type: system_equity, amount: -200 }
 * ]
 * SUM = +200 + (-200) = 0 ✓
 */
@Entity('point_transaction_entries')
@Index('idx_entry_transaction', ['transactionId'])
@Index('idx_entry_user_account', ['userId', 'accountType'])
@Index('idx_entry_account', ['accountType'])
export class PointTransactionEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  /**
   * User ID who owns this entry
   * NULL for system accounts (system_liability, system_equity)
   */
  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @Column({
    name: 'account_type',
    type: 'enum',
    enum: AccountType,
  })
  accountType: AccountType;

  /**
   * Amount of this entry
   * - Positive = Debit (increase asset, decrease liability)
   * - Negative = Credit (decrease asset, increase liability)
   *
   * CRITICAL: For each transaction, SUM(amount) MUST = 0
   */
  @Column({ type: 'int' })
  readonly amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Relations
  @ManyToOne(() => PointTransaction, (transaction) => transaction.entries)
  @JoinColumn({ name: 'transaction_id' })
  transaction: PointTransaction;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  /**
   * Payment-Grade Immutability Guard
   * Prevents any updates to entry records
   */
  @BeforeUpdate()
  preventUpdate(): void {
    throw new Error(
      'point_transaction_entries are immutable. Create a reversal transaction instead.',
    );
  }

  /**
   * Payment-Grade Immutability Guard
   * Prevents any deletes of entry records
   */
  @BeforeRemove()
  preventDelete(): void {
    throw new Error(
      'point_transaction_entries cannot be deleted. They are permanent audit trail.',
    );
  }
}
