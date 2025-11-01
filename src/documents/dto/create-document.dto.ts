import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

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
}
