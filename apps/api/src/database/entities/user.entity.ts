import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationMembership } from './organization-membership.entity';

export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
}

/**
 * User - Global User Identity (Multi-Org Architecture)
 *
 * ⚠️ CRITICAL ARCHITECTURAL CHANGE:
 * Users are NO LONGER tied to a single organization.
 * One user can belong to MULTIPLE organizations via organization_memberships.
 *
 * Authentication Methods:
 * - Email/Password: password_hash is set, email_verified_at set after verification
 * - OAuth (Google/Microsoft): password_hash is NULL, email_verified_at set immediately
 * - Hybrid: Both password_hash and oauth_connections exist
 *
 * Multi-Org Model:
 * - email is globally unique (one account, many orgs)
 * - NO org_id, NO role, NO department_id on user (moved to organization_memberships)
 * - User can be admin in Org A, member in Org B, owner in Org C
 * - Each organization membership has its own role and department
 *
 * Authorization Flow:
 * 1. User logs in → Query organization_memberships
 * 2. User selects organization → JWT contains { orgId, role, departmentId } from membership
 * 3. All requests validate: Does user have active membership in requested org?
 *
 * See: organization_memberships table for org-specific data (role, department)
 */
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string; // Globally unique (not per org)

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string; // NULL for OAuth-only users

  @Column({ type: 'timestamptz', name: 'email_verified_at', nullable: true })
  emailVerifiedAt: Date; // NULL = unverified, timestamp = verified

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean; // Global account status (affects all org memberships)

  // Relations
  @OneToMany(() => OrganizationMembership, (membership) => membership.user)
  memberships: OrganizationMembership[]; // User's organization memberships
}
