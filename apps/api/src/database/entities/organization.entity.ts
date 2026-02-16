import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { CoreValue } from './core-value.entity';

export enum OrgPlan {
  FREE = 'free',
  PRO_TRIAL = 'pro_trial',
  PRO = 'pro',
}

export enum Industry {
  TECH = 'tech',
  GAMING = 'gaming',
  AGENCY = 'agency',
  FINANCE = 'finance',
  OTHER = 'other',
}

export enum CompanySize {
  SMALL = '1-10',
  MEDIUM = '11-50',
  LARGE = '51-200',
  XLARGE = '201-500',
  ENTERPRISE = '500+',
}

/**
 * Organization Settings Structure (Admin-Configurable)
 */
export interface OrganizationSettings {
  points?: {
    minPerKudo: number;
    maxPerKudo: number;
  };
  budget?: {
    monthlyGivingBudget: number;
    resetDay: number; // Day of month (1-28)
  };
}

@Entity('organizations')
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'enum', enum: Industry, nullable: true })
  industry: Industry;

  @Column({
    name: 'company_size',
    type: 'enum',
    enum: CompanySize,
    nullable: true,
  })
  companySize: CompanySize;

  @Column({ type: 'jsonb', default: {} })
  settings: OrganizationSettings;

  @Column({ type: 'enum', enum: OrgPlan, default: OrgPlan.PRO_TRIAL })
  plan: OrgPlan;

  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  trialEndsAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => CoreValue, (value) => value.organization)
  coreValues: CoreValue[];
}
