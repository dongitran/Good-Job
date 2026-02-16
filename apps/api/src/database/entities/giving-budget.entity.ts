import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('giving_budgets')
@Unique('idx_budget_user_month', ['userId', 'month'])
export class GivingBudget {
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
