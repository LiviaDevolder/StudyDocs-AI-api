import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateMessageInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @Field()
  @IsNotEmpty()
  @IsUUID()
  conversationId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  query: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  response: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  role?: string;
}
