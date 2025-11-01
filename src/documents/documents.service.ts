import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentInput } from './dto/create-document.dto';
import { UpdateDocumentInput } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async create(createDocumentInput: CreateDocumentInput): Promise<Document> {
    const document = this.documentRepository.create(createDocumentInput);
    return await this.documentRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return await this.documentRepository.find({
      relations: ['project'],
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['project', 'chunks'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async findByProject(projectId: string): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { projectId },
      relations: ['project', 'chunks'],
    });
  }

  async update(
    id: string,
    updateDocumentInput: UpdateDocumentInput,
  ): Promise<Document> {
    const document = await this.findOne(id);
    Object.assign(document, updateDocumentInput);
    return await this.documentRepository.save(document);
  }

  async remove(id: string): Promise<boolean> {
    const document = await this.findOne(id);
    await this.documentRepository.remove(document);
    return true;
  }
}
