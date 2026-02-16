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
import { User } from './user.entity';

/**
 * Departments for organizing users within an organization
 * Used for filtering, analytics, and team management
 */
@Entity('departments')
@Unique('idx_department_org_name', ['orgId', 'name'])
export class Department extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'org_id' })
  orgId: string;

  @Column()
  name: string;

  // Relations
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @OneToMany(() => User, (user) => user.department)
  users: User[];
}
