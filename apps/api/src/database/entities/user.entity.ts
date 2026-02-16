import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { Department } from './department.entity';

export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
}

/**
 * User - Core authentication and profile entity
 *
 * Authentication Methods:
 * - Email/Password: password_hash is set, email_verified_at set after verification
 * - OAuth (Google/Microsoft): password_hash is NULL, email_verified_at set immediately
 * - Hybrid: Both password_hash and oauth_connections exist
 *
 * Organization Linking:
 * - org_id can be NULL during OAuth onboarding
 * - Application MUST enforce org_id is set before granting app access
 * - See invitations table for team invitation flow
 */
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string; // NULL for OAuth-only users

  @Column({ type: 'timestamptz', name: 'email_verified_at', nullable: true })
  emailVerifiedAt: Date; // NULL = unverified, timestamp = verified

  @Column({ name: 'full_name' })
  fullName: string;

  @Index()
  @Column({ name: 'org_id', nullable: true })
  orgId: string; // NULLABLE during OAuth onboarding, required before app access

  @Column({ name: 'department_id', nullable: true })
  departmentId: string; // FK to departments table

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => Organization, (org) => org.users)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @ManyToOne(() => Department, (dept) => dept.users)
  @JoinColumn({ name: 'department_id' })
  department: Department;
}
