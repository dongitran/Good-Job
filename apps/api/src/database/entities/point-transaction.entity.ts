import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeUpdate,
  BeforeRemove,
} from 'typeorm';
import { User } from './user.entity';

export enum TransactionType {
  GIVE = 'give',
  RECEIVE = 'receive',
  REDEEM = 'redeem',
  BUDGET_RESET = 'reset',
}

export enum BalanceType {
  GIVEABLE = 'giveable',
  REDEEMABLE = 'redeemable',
}

/**
 * IMMUTABLE LEDGER PATTERN (Payment-Grade)
 *
 * This table is the single source of truth for ALL point movements.
 * ⚠️ CRITICAL RULES:
 * - NO updates allowed after insert
 * - NO deletes allowed (not even soft delete)
 * - Balance = SUM(amount) per user per balance_type
 * - Error correction: Create reversal transaction with opposite amount
 *
 * Example:
 * - GIVE:    user_1, -50, giveable   (deduct from giving budget)
 * - RECEIVE: user_2, +50, redeemable (add to earning wallet)
 * - REDEEM:  user_2, -500, redeemable (spend for reward)
 * - RESET:   user_1, +200, giveable   (monthly budget allocation)
 */
@Entity('point_transactions')
@Index('idx_point_tx_user_balance', ['userId', 'balanceType', 'createdAt'])
@Index('idx_point_tx_reference', ['referenceType', 'referenceId'])
export class PointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'int' })
  amount: number;

  @Column({ name: 'balance_type', type: 'enum', enum: BalanceType })
  balanceType: BalanceType;

  @Column({ name: 'reference_type', nullable: true })
  referenceType: string;

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

  // ❌ NO @UpdateDateColumn()
  // ❌ NO @DeleteDateColumn()

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

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
