import { InputType, Field, PartialType, Int } from '@nestjs/graphql';
import { CreateDocumentInput } from './create-document.dto';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { DocumentStatus } from '../entities/document.entity';

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

  @Field(() => DocumentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @Field(() => Int, { nullable: true, description: 'File size in bytes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;
}
