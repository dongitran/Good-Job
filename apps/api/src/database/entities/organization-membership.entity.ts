import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { Department } from './department.entity';
import { UserRole } from './enums';

/**
 * Organization Memberships - Many-to-Many User ↔ Organization
 *
 * Enables multi-org support: One user can belong to multiple organizations
 * with different roles and departments per organization.
 *
 * Examples:
 * - john@example.com → Org A (admin, Engineering)
 * - john@example.com → Org B (member, Product)
 * - john@example.com → Org C (owner, null)
 *
 * Authentication Flow:
 * 1. User logs in → Query memberships
 * 2. If 1 membership → Auto-select org
 * 3. If 2+ memberships → Show org selector
 * 4. Generate JWT with selected org context
 *
 * Authorization:
 * - Role is org-specific (stored here, not on user)
 * - Department is org-specific (stored here, not on user)
 * - Check: SELECT role FROM organization_memberships WHERE user_id AND org_id
 */
@Entity('organization_memberships')
@Unique('idx_membership_user_org', ['userId', 'orgId'])
export class OrganizationMembership extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Index()
  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole; // Role within THIS organization

  @Column({ name: 'department_id', nullable: true })
  departmentId: string; // Department within THIS organization

  @Column({ name: 'is_active', default: true })
  isActive: boolean; // Can deactivate membership without deleting

  @Column({ type: 'timestamptz', name: 'joined_at' })
  joinedAt: Date; // When user joined this organization

  // Relations
  @ManyToOne(() => User, (user) => user.memberships)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;
}
