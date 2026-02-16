import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Recognition } from './recognition.entity';
import { User } from './user.entity';

@Entity('recognition_reactions')
@Unique('idx_reaction_unique', ['recognitionId', 'userId', 'emoji'])
export class RecognitionReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recognition_id' })
  recognitionId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 10 })
  emoji: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Recognition, (recognition) => recognition.reactions)
  @JoinColumn({ name: 'recognition_id' })
  recognition: Recognition;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
