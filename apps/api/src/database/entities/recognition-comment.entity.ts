import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Recognition } from './recognition.entity';
import { User } from './user.entity';

@Entity('recognition_comments')
export class RecognitionComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recognition_id' })
  recognitionId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Recognition, (recognition) => recognition.comments)
  @JoinColumn({ name: 'recognition_id' })
  recognition: Recognition;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
