import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document, DocumentStatus } from './entities/document.entity';
import { CreateDocumentInput } from './dto/create-document.dto';
import { UpdateDocumentInput } from './dto/update-document.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { FileUpload } from '../types/graphql-upload';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

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
  async findByProject(
    @Args('projectId') projectId: string,
  ): Promise<Document[]> {
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

  @Mutation(() => Int, {
    description: 'Remove all documents with a specific status (e.g., pending, failed)',
  })
  @UseGuards(GqlAuthGuard)
  async removeDocumentsByStatus(
    @Args('status', { type: () => DocumentStatus }) status: DocumentStatus,
    @Args('projectId', { nullable: true }) projectId?: string,
  ): Promise<number> {
    return await this.documentsService.removeByStatus(status, projectId);
  }

  @Mutation(() => Document)
  @UseGuards(GqlAuthGuard)
  async uploadDocument(
    @Args('projectId') projectId: string,
    @Args({ name: 'file', type: () => GraphQLUpload })
    filePromise: Promise<FileUpload>,
    @CurrentUser() user: User,
  ): Promise<Document> {
    const fileValidationPipe = new FileValidationPipe();
    const file = await fileValidationPipe.transform(filePromise);
    
    return await this.documentsService.uploadDocument(projectId, Promise.resolve(file), user);
  }
}
