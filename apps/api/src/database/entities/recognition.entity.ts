import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { CoreValue } from './core-value.entity';
import { RecognitionReaction } from './recognition-reaction.entity';
import { RecognitionComment } from './recognition-comment.entity';

@Entity('recognitions')
@Index('idx_recognitions_org_created', ['orgId', 'createdAt'])
export class Recognition extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Index('idx_recognitions_giver')
  @Column({ name: 'giver_id' })
  giverId: string;

  @Index('idx_recognitions_receiver')
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

  @OneToMany(() => RecognitionReaction, (reaction) => reaction.recognition)
  reactions: RecognitionReaction[];

  @OneToMany(() => RecognitionComment, (comment) => comment.recognition)
  comments: RecognitionComment[];
}
