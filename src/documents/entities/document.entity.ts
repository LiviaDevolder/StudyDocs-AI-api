import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { DocumentChunk } from '../../document-chunks/entities/document-chunk.entity';

export enum DocumentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

registerEnumType(DocumentStatus, {
  name: 'DocumentStatus',
  description: 'The processing status of a document',
});

@ObjectType()
@Entity('documents')
export class Document {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'project_id' })
  projectId: string;

  @Field(() => Project)
  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ name: 'gcs_path' })
  gcsPath: string;

  @Field()
  @Column()
  type: string;

  @Field(() => DocumentStatus)
  @Column({
    type: 'varchar',
    length: 20,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Field(() => Int, { description: 'File size in bytes' })
  @Column({ name: 'file_size', type: 'bigint', default: 0 })
  fileSize: number;

  @Field()
  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @Field(() => [DocumentChunk])
  @OneToMany(() => DocumentChunk, (documentChunk) => documentChunk.document)
  chunks: DocumentChunk[];
}
