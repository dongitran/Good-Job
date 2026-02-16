import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { CoreValue } from './core-value.entity';
import { KudoReaction } from './kudo-reaction.entity';
import { KudoComment } from './kudo-comment.entity';

@Entity('kudos')
@Index('idx_kudos_org_created', ['orgId', 'createdAt'])
export class Kudo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Index('idx_kudos_giver')
  @Column({ name: 'giver_id' })
  giverId: string;

  @Index('idx_kudos_receiver')
  @Column({ name: 'receiver_id' })
  receiverId: string;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'value_id' })
  valueId: string;

  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'giver_id' })
  giver: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @ManyToOne(() => CoreValue)
  @JoinColumn({ name: 'value_id' })
  coreValue: CoreValue;

  @OneToMany(() => KudoReaction, (reaction) => reaction.kudo)
  reactions: KudoReaction[];

  @OneToMany(() => KudoComment, (comment) => comment.kudo)
  comments: KudoComment[];
}
