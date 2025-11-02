import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

export interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => NodeJS.ReadableStream;
}

@InputType()
export class UploadDocumentInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;
}
