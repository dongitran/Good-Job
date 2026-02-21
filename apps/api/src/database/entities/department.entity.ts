import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { OrganizationMembership } from './organization-membership.entity';

/**
 * Departments for organizing users within an organization
 *
 * Used for filtering, analytics, and team management.
 * Users are assigned to departments via organization_memberships table.
 */
@Entity('departments')
@Unique('idx_department_org_name', ['orgId', 'name'])
export class Department extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @Column()
  name: string;

  // Relations
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @OneToMany(
    () => OrganizationMembership,
    (membership) => membership.department,
  )
  memberships: OrganizationMembership[]; // Users in this department (via memberships)
}
