import { ObjectType, Field, ID } from '@nestjs/graphql';
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

  @Field()
  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @Field(() => [DocumentChunk])
  @OneToMany(() => DocumentChunk, (documentChunk) => documentChunk.document)
  chunks: DocumentChunk[];
}
