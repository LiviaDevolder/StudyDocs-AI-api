import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateDocumentInput } from './create-document.dto';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateDocumentInput extends PartialType(CreateDocumentInput) {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  gcsPath?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  type?: string;
}
