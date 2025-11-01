import { InputType, Field, Float } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

@InputType()
export class CreateDocumentChunkInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  documentId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  content: string;

  @Field(() => [Float], { nullable: true })
  @IsOptional()
  @IsArray()
  embedding?: number[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  metadata?: object;
}
