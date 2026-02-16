import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Kudo } from './kudo.entity';
import { User } from './user.entity';

@Entity('kudo_comments')
export class KudoComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kudo_id' })
  kudoId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Kudo, (kudo) => kudo.comments)
  @JoinColumn({ name: 'kudo_id' })
  kudo: Kudo;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
