import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateConversationInput } from './create-conversation.dto';
import { IsString, MaxLength, IsOptional } from 'class-validator';

@InputType()
export class UpdateConversationInput extends PartialType(
  CreateConversationInput,
) {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}
