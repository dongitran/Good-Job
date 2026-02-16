import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Kudo } from './kudo.entity';
import { User } from './user.entity';

@Entity('kudo_reactions')
@Unique('idx_reaction_unique', ['kudoId', 'userId', 'emoji'])
export class KudoReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kudo_id' })
  kudoId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 10 })
  emoji: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Kudo, (kudo) => kudo.reactions)
  @JoinColumn({ name: 'kudo_id' })
  kudo: Kudo;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
