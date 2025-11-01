import { InputType, PartialType } from '@nestjs/graphql';
import { CreateDocumentChunkInput } from './create-document-chunk.dto';

@InputType()
export class UpdateDocumentChunkInput extends PartialType(
  CreateDocumentChunkInput,
) {}
