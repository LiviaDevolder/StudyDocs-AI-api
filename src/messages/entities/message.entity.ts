import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

@ObjectType()
@Entity('messages')
export class Message {
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
  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Field(() => Conversation)
  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Field()
  @Column({ type: 'text' })
  query: string;

  @Field()
  @Column({ type: 'text' })
  response: string;

  @Field()
  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
