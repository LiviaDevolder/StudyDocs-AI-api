import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Message } from '../../messages/entities/message.entity';
import { DocumentChunk } from '../../document-chunks/entities/document-chunk.entity';

@ObjectType()
@Entity('message_chunk_references')
export class MessageChunkReference {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'message_id' })
  messageId: string;

  @Field(() => Message)
  @ManyToOne(() => Message)
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Field()
  @Column({ name: 'chunk_id' })
  chunkId: string;

  @Field(() => DocumentChunk)
  @ManyToOne(() => DocumentChunk)
  @JoinColumn({ name: 'chunk_id' })
  chunk: DocumentChunk;

  @Field(() => Float, { description: 'Relevance score from similarity search' })
  @Column({ type: 'float', default: 0 })
  relevanceScore: number;

  @Field({ nullable: true, description: 'Order in which this chunk was used' })
  @Column({ type: 'int', nullable: true })
  order: number;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
