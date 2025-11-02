import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus } from './entities/document.entity';
import { CreateDocumentInput } from './dto/create-document.dto';
import { UpdateDocumentInput } from './dto/update-document.dto';
import { GcsService } from '../common/services/gcs.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly gcsService: GcsService,
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
    try {
      await this.gcsService.deleteFile(document.gcsPath);
    } catch (error) {
      console.error(`Failed to delete file from GCS: ${error.message}`);
    }
    
    await this.documentRepository.remove(document);
    return true;
  }
  async uploadDocument(
    projectId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not supported. Allowed types: TXT, MD, PDF, DOCX, and images (JPEG, PNG, GIF, WebP, SVG, BMP, TIFF)`,
      );
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of 50MB`,
      );
    }

    try {
      const uploadedFileInfo = await this.gcsService.uploadFile(
        file,
        `projects/${projectId}`,
      );

      const document = this.documentRepository.create({
        projectId,
        name: file.originalname,
        gcsPath: uploadedFileInfo.gcsPath,
        type: uploadedFileInfo.mimeType,
        fileSize: uploadedFileInfo.size,
        status: DocumentStatus.PENDING,
      });

      return await this.documentRepository.save(document);
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload document: ${error.message}`,
      );
    }
  }
}

