import { InputType, Field, Float, PartialType } from '@nestjs/graphql';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { CreateMessageChunkReferenceDto } from './create-message-chunk-reference.dto';

@InputType()
export class UpdateMessageChunkReferenceDto extends PartialType(
  CreateMessageChunkReferenceDto,
) {
  @Field(() => Float, {
    nullable: true,
    description: 'Relevance score from similarity search (0-1)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  relevanceScore?: number;

  @Field({ nullable: true, description: 'Order in which this chunk was used' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}
