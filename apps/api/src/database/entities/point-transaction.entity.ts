import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
  BeforeUpdate,
  BeforeRemove,
} from 'typeorm';
import { TransactionType } from './enums';
import { PointTransactionEntry } from './point-transaction-entry.entity';

/**
 * DOUBLE-ENTRY BOOKKEEPING - JOURNAL HEADER
 *
 * This table is the journal header for double-entry transactions.
 * Each transaction links to 2+ balanced entries in point_transaction_entries.
 *
 * ⚠️ CRITICAL RULES (Payment-Grade):
 * - NO updates allowed after insert
 * - NO deletes allowed (not even soft delete)
 * - Each transaction MUST have balanced entries (SUM(entries.amount) = 0)
 * - Error correction: Create reversal transaction (transaction_type='reversal')
 *
 * Architecture:
 * - point_transactions = Journal header (this table)
 * - point_transaction_entries = Journal lines (double-entry)
 * - Zero-sum constraint enforced at entry level
 *
 * Example:
 * Transaction (Recognition):
 *   id: tx_1
 *   transaction_type: recognition
 *   reference_id: rec_123
 *
 * Entries (MUST sum to 0):
 *   [tx_1, user_A, giveable,   -50]  ← Debit (decrease giver's budget)
 *   [tx_1, user_B, redeemable, +50]  ← Credit (increase receiver's wallet)
 *   SUM = 0 ✓
 */
@Entity('point_transactions')
@Index('idx_point_tx_org', ['orgId'])
@Index('idx_point_tx_reference', ['referenceType', 'referenceId'])
@Index('idx_point_tx_created', ['createdAt'])
export class PointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column({ name: 'reference_type', nullable: true })
  referenceType: string; // 'recognition' | 'redemption' | 'budget' | null

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Immutability: readonly fields
   * These fields cannot be updated after creation
   */
  @Column({ name: 'created_by' })
  readonly createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  // ❌ NO @UpdateDateColumn() - transactions are immutable
  // ❌ NO @DeleteDateColumn() - transactions are permanent

  // Relations
  @OneToMany(() => PointTransactionEntry, (entry) => entry.transaction, {
    cascade: true,
  })
  entries: PointTransactionEntry[];

  /**
   * Payment-Grade Immutability Guard
   * Prevents any updates to transaction records
   */
  @BeforeUpdate()
  preventUpdate(): void {
    throw new Error(
      'point_transactions are immutable. Create a reversal transaction instead.',
    );
  }

  /**
   * Payment-Grade Immutability Guard
   * Prevents any deletes of transaction records
   */
  @BeforeRemove()
  preventDelete(): void {
    throw new Error(
      'point_transactions cannot be deleted. They are permanent audit trail.',
    );
  }
}
