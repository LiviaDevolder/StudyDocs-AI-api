import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Document } from '../../documents/entities/document.entity';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
@Entity('document_chunks')
export class DocumentChunk {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'uuid' })
  documentId: string;

  @Field(() => Document)
  @ManyToOne(() => Document, (document) => document.chunks)
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Field()
  @Column({ type: 'text' })
  content: string;

  @Field(() => [Float], { nullable: true })
  @Column({ type: 'vector', nullable: true })
  embedding: number[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: object;

  @Field()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
