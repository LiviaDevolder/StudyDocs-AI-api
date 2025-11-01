import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { CreateDocumentInput } from './dto/create-document.dto';
import { UpdateDocumentInput } from './dto/update-document.dto';

@Resolver(() => Document)
export class DocumentsResolver {
  constructor(private readonly documentsService: DocumentsService) {}

  @Mutation(() => Document)
  async createDocument(
    @Args('createDocumentInput') createDocumentInput: CreateDocumentInput,
  ): Promise<Document> {
    return await this.documentsService.create(createDocumentInput);
  }

  @Query(() => [Document], { name: 'documents' })
  async findAll(): Promise<Document[]> {
    return await this.documentsService.findAll();
  }

  @Query(() => Document, { name: 'document' })
  async findOne(@Args('id') id: string): Promise<Document> {
    return await this.documentsService.findOne(id);
  }

  @Query(() => [Document], { name: 'documentsByProject' })
  async findByProject(@Args('projectId') projectId: string): Promise<Document[]> {
    return await this.documentsService.findByProject(projectId);
  }

  @Mutation(() => Document)
  async updateDocument(
    @Args('id') id: string,
    @Args('updateDocumentInput') updateDocumentInput: UpdateDocumentInput,
  ): Promise<Document> {
    return await this.documentsService.update(id, updateDocumentInput);
  }

  @Mutation(() => Boolean)
  async removeDocument(@Args('id') id: string): Promise<boolean> {
    return await this.documentsService.remove(id);
  }
}
