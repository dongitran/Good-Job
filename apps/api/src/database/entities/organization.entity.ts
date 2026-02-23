import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationMembership } from './organization-membership.entity';
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
 *
 * Configured via Settings UI (11-settings-profile.png)
 */
export interface OrganizationSettings {
  points?: {
    minPerKudo?: number; // Min points per recognition (default: 1)
    maxPerKudo?: number; // Max points per recognition (default: 50)
    valueInCurrency?: number; // Point monetary value (e.g., 1000 = 1 point = 1000 VND)
    currency?: string; // Currency code (e.g., "VND", "USD")
  };
  budget?: {
    monthlyGivingBudget?: number; // Monthly points per user (default: 200)
    resetDay?: number; // Day of month to reset budgets (1-31, default: 1)
    allowRollover?: boolean; // Carry unused points to next cycle
    managerBonusEnabled?: boolean; // Toggle manager bonus budget
    managerBonusAmount?: number; // Extra points per month for managers
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

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string; // Organization logo uploaded during onboarding

  @Column({ type: 'jsonb', default: {} })
  settings: OrganizationSettings;

  @Column({ type: 'varchar', nullable: true })
  timezone: string;

  @Column({ type: 'varchar', nullable: true, default: 'en' })
  language: string;

  @Column({ name: 'company_domain', type: 'varchar', nullable: true })
  companyDomain: string;

  @Column({ type: 'enum', enum: OrgPlan, default: OrgPlan.PRO_TRIAL })
  plan: OrgPlan;

  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  trialEndsAt: Date;

  @Column({
    name: 'onboarding_completed_at',
    type: 'timestamptz',
    nullable: true,
  })
  onboardingCompletedAt: Date | null;

  @OneToMany(
    () => OrganizationMembership,
    (membership) => membership.organization,
  )
  memberships: OrganizationMembership[]; // Organization's members (via memberships)

  @OneToMany(() => CoreValue, (value) => value.organization)
  coreValues: CoreValue[];
}
