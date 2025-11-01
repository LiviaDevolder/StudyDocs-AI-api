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
  @Column({ type: 'text' })
  query: string;

  @Field()
  @Column({ type: 'text' })
  response: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
