import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Monthly Point Budget with Optimistic Locking
 *
 * Tracks how many points each user can give away per month.
 * - total_budget: Allocated monthly (e.g., 200 points)
 * - spent: Points already given away
 * - version: Optimistic locking to prevent race conditions
 *
 * Budget resets on the 1st of each month (CRON job creates new record).
 */
@Entity('monthly_point_budgets')
@Unique('idx_budget_user_month', ['userId', 'month'])
export class MonthlyPointBudget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'date' })
  month: Date;

  @Column({ name: 'total_budget', type: 'int' })
  totalBudget: number;

  @Column({ type: 'int', default: 0 })
  spent: number;

  /**
   * Optimistic Locking: Prevents race conditions
   * Increments on each update. Update fails if version mismatch.
   */
  @Column({ type: 'int', default: 0 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
