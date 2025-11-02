import { InputType, Field, Float } from '@nestjs/graphql';
import { IsUUID, IsNumber, IsOptional, Min, Max } from 'class-validator';

@InputType()
export class CreateMessageChunkReferenceDto {
  @Field()
  @IsUUID()
  messageId: string;

  @Field()
  @IsUUID()
  chunkId: string;

  @Field(() => Float, {
    description: 'Relevance score from similarity search (0-1)',
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  relevanceScore: number;

  @Field({ nullable: true, description: 'Order in which this chunk was used' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}
