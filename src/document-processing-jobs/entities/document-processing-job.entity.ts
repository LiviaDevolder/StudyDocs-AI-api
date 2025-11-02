import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from '../../documents/entities/document.entity';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum JobType {
  UPLOAD = 'upload',
  CHUNKING = 'chunking',
  EMBEDDING = 'embedding',
  FULL_PROCESS = 'full_process',
}

registerEnumType(JobStatus, {
  name: 'JobStatus',
  description: 'The status of a document processing job',
});

registerEnumType(JobType, {
  name: 'JobType',
  description: 'The type of document processing operation',
});

@ObjectType()
@Entity('document_processing_jobs')
export class DocumentProcessingJob {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'document_id' })
  documentId: string;

  @Field(() => Document)
  @ManyToOne(() => Document)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Field(() => JobType)
  @Column({
    type: 'varchar',
    length: 50,
    default: JobType.FULL_PROCESS,
  })
  type: JobType;

  @Field(() => JobStatus)
  @Column({
    type: 'varchar',
    length: 20,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Field({ nullable: true, description: 'Current progress percentage (0-100)' })
  @Column({ type: 'int', nullable: true, default: 0 })
  progress: number;

  @Field({ nullable: true, description: 'Current step description' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  currentStep: string;

  @Field({ nullable: true, description: 'Error message if job failed' })
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Field({ nullable: true, description: 'Error stack trace for debugging' })
  @Column({ type: 'text', nullable: true })
  errorStack: string;

  @Field({ nullable: true, description: 'Total number of chunks to process' })
  @Column({ type: 'int', nullable: true })
  totalChunks: number;

  @Field({ nullable: true, description: 'Number of chunks processed' })
  @Column({ type: 'int', nullable: true, default: 0 })
  processedChunks: number;

  @Field({ nullable: true, description: 'When the job started processing' })
  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Field({ nullable: true, description: 'When the job completed or failed' })
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
