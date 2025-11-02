import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreateConversationInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;
}
