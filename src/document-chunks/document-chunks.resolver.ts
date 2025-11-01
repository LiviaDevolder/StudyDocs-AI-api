import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { DocumentChunksService } from './document-chunks.service';
import { DocumentChunk } from './entities/document-chunk.entity';
import { CreateDocumentChunkInput } from './dto/create-document-chunk.dto';
import { UpdateDocumentChunkInput } from './dto/update-document-chunk.dto';

@Resolver(() => DocumentChunk)
export class DocumentChunksResolver {
  constructor(private readonly documentChunksService: DocumentChunksService) {}

  @Mutation(() => DocumentChunk)
  async createDocumentChunk(
    @Args('createDocumentChunkInput')
    createDocumentChunkInput: CreateDocumentChunkInput,
  ): Promise<DocumentChunk> {
    return await this.documentChunksService.create(createDocumentChunkInput);
  }

  @Query(() => [DocumentChunk], { name: 'documentChunks' })
  async findAll(): Promise<DocumentChunk[]> {
    return await this.documentChunksService.findAll();
  }

  @Query(() => DocumentChunk, { name: 'documentChunk' })
  async findOne(@Args('id') id: string): Promise<DocumentChunk> {
    return await this.documentChunksService.findOne(id);
  }

  @Query(() => [DocumentChunk], { name: 'documentChunksByDocument' })
  async findByDocument(
    @Args('documentId') documentId: string,
  ): Promise<DocumentChunk[]> {
    return await this.documentChunksService.findByDocument(documentId);
  }

  @Mutation(() => DocumentChunk)
  async updateDocumentChunk(
    @Args('id') id: string,
    @Args('updateDocumentChunkInput')
    updateDocumentChunkInput: UpdateDocumentChunkInput,
  ): Promise<DocumentChunk> {
    return await this.documentChunksService.update(
      id,
      updateDocumentChunkInput,
    );
  }

  @Mutation(() => Boolean)
  async removeDocumentChunk(@Args('id') id: string): Promise<boolean> {
    return await this.documentChunksService.remove(id);
  }
}
