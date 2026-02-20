import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum RewardCategory {
  SWAG = 'swag',
  GIFT_CARD = 'gift_card',
  TIME_OFF = 'time_off',
  EXPERIENCE = 'experience',
  CHARITY = 'charity',
}

@Entity('rewards')
export class Reward extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'points_cost', type: 'int' })
  pointsCost: number;

  @Column({ type: 'enum', enum: RewardCategory, default: RewardCategory.SWAG })
  category: RewardCategory;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'int', default: -1 })
  stock: number; // -1 = unlimited

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
