import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';

export abstract class BaseEntity {
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string; // User ID who created this record

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string; // User ID who last updated this record

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date; // Soft delete timestamp

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: string; // User ID who deleted this record
}
