import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateMessageInput } from './create-message.dto';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateMessageInput extends PartialType(CreateMessageInput) {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  query?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  response?: string;
}
