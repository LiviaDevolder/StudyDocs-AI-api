import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { DocumentStatus } from '../entities/document.entity';

@InputType()
export class CreateDocumentInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  gcsPath: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  type: string;

  @Field(() => DocumentStatus, {
    nullable: true,
    defaultValue: DocumentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @Field(() => Int, { nullable: true, description: 'File size in bytes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;
}
