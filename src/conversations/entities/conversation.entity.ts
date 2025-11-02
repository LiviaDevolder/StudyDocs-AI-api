import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Message } from '../../messages/entities/message.entity';

@ObjectType()
@Entity('conversations')
export class Conversation {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'project_id' })
  projectId: string;

  @Field(() => Project)
  @ManyToOne(() => Project, (project) => project.conversations)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Field(() => [Message], { nullable: true })
  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
