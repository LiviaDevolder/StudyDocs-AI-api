import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Document } from '../../documents/entities/document.entity';
import { Message } from '../../messages/entities/message.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

@Entity('projects')
@ObjectType()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Field()
  name: string;

  @Column({ type: 'uuid' })
  @Field()
  userId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  @Field()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Field()
  updatedAt: Date;

  @OneToMany(() => Document, (document) => document.project)
  @Field(() => [Document], { nullable: true })
  documents: Document[];

  @OneToMany(() => Conversation, (conversation) => conversation.project)
  @Field(() => [Conversation], { nullable: true })
  conversations: Conversation[];

  @OneToMany(() => Message, (message) => message.project)
  @Field(() => [Message], { nullable: true })
  messages: Message[];
}
