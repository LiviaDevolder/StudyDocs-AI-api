import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Document } from '../../documents/entities/document.entity';
import { Message } from '../../messages/entities/message.entity';

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

  @CreateDateColumn({ type: 'timestamp' })
  @Field()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Field()
  updatedAt: Date;

  @OneToMany(() => Document, (document) => document.project)
  @Field(() => [Document], { nullable: true })
  documents: Document[];

  @OneToMany(() => Message, (message) => message.project)
  @Field(() => [Message], { nullable: true })
  messages: Message[];
}
