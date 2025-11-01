import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from './entities/document-chunk.entity';
import { CreateDocumentChunkInput } from './dto/create-document-chunk.dto';
import { UpdateDocumentChunkInput } from './dto/update-document-chunk.dto';

@Injectable()
export class DocumentChunksService {
  constructor(
    @InjectRepository(DocumentChunk)
    private readonly documentChunkRepository: Repository<DocumentChunk>,
  ) {}

  async create(
    createDocumentChunkInput: CreateDocumentChunkInput,
  ): Promise<DocumentChunk> {
    const documentChunk = this.documentChunkRepository.create(
      createDocumentChunkInput,
    );
    return await this.documentChunkRepository.save(documentChunk);
  }

  async findAll(): Promise<DocumentChunk[]> {
    return await this.documentChunkRepository.find();
  }

  async findOne(id: string): Promise<DocumentChunk> {
    const documentChunk = await this.documentChunkRepository.findOne({
      where: { id },
    });

    if (!documentChunk) {
      throw new NotFoundException(`DocumentChunk with ID ${id} not found`);
    }

    return documentChunk;
  }

  async findByDocument(documentId: string): Promise<DocumentChunk[]> {
    return await this.documentChunkRepository.find({
      where: { documentId },
    });
  }

  async update(
    id: string,
    updateDocumentChunkInput: UpdateDocumentChunkInput,
  ): Promise<DocumentChunk> {
    const documentChunk = await this.findOne(id);
    Object.assign(documentChunk, updateDocumentChunkInput);
    return await this.documentChunkRepository.save(documentChunk);
  }

  async remove(id: string): Promise<boolean> {
    const documentChunk = await this.findOne(id);
    await this.documentChunkRepository.remove(documentChunk);
    return true;
  }
}
