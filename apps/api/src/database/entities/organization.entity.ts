import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { CoreValue } from './core-value.entity';

export enum OrgPlan {
  FREE = 'free',
  PRO_TRIAL = 'pro_trial',
  PRO = 'pro',
}

@Entity('organizations')
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ name: 'company_size', nullable: true })
  companySize: string;

  @Column({ type: 'jsonb', default: {} })
  settings: {
    monthlyBudget?: number;
    minPoints?: number;
    maxPoints?: number;
  };

  @Column({ type: 'enum', enum: OrgPlan, default: OrgPlan.PRO_TRIAL })
  plan: OrgPlan;

  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  trialEndsAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => CoreValue, (value) => value.organization)
  coreValues: CoreValue[];
}
