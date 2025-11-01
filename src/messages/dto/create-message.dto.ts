import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateMessageInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  query: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  response: string;
}
