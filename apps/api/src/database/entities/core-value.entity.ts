import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';

@Entity('core_values')
export class CoreValue extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  emoji: string;

  @Column({ nullable: true })
  color: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Organization, (org) => org.coreValues)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;
}
