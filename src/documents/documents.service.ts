import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus } from './entities/document.entity';
import { CreateDocumentInput } from './dto/create-document.dto';
import { UpdateDocumentInput } from './dto/update-document.dto';
import { GcsService, UploadFileInput } from '../common/services/gcs.service';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { FileUpload } from '../types/graphql-upload';
import { uploadConfig } from '../config/upload.config';
import { DocumentProcessingJobsService } from '../document-processing-jobs/document-processing-jobs.service';
import { DocumentProcessingQueueService } from '../document-processing-jobs/services/document-processing-queue.service';
import { JobType } from '../document-processing-jobs/entities/document-processing-job.entity';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly gcsService: GcsService,
    private readonly jobsService: DocumentProcessingJobsService,
    private readonly queueService: DocumentProcessingQueueService,
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
    filePromise: Promise<FileUpload>,
    user: User,
  ): Promise<Document> {
    // Verify project exists and user owns it
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to upload documents to this project',
      );
    }

    // Get file from promise (validation already done by FileValidationPipe)
    const fileUpload = await filePromise;

    try {
      // Read file stream into buffer with size limit
      const chunks: Uint8Array[] = [];
      let totalSize = 0;

      const stream = fileUpload.createReadStream();

      for await (const chunk of stream) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalSize += buffer.length;

        // Check size limit during streaming
        if (totalSize > uploadConfig.maxFileSize) {
          stream.destroy();
          throw new BadRequestException(
            `File size exceeds maximum allowed size of ${uploadConfig.maxFileSize / (1024 * 1024)}MB`,
          );
        }

        chunks.push(buffer);
      }

      const buffer = Buffer.concat(chunks);

      // Create file input for GcsService
      const fileInput: UploadFileInput = {
        buffer,
        originalname: fileUpload.filename,
        mimetype: fileUpload.mimetype,
        size: totalSize,
      };

      // Upload to GCS
      const uploadedFileInfo = await this.gcsService.uploadFile(
        fileInput,
        `projects/${projectId}`,
      );

      this.logger.log(
        `File "${fileUpload.filename}" uploaded successfully for project ${projectId} by user ${user.id}`,
      );

      // Save document metadata to database
      const document = this.documentRepository.create({
        projectId,
        name: fileUpload.filename,
        gcsPath: uploadedFileInfo.gcsPath,
        type: fileUpload.mimetype,
        fileSize: totalSize,
        status: DocumentStatus.PENDING,
      });

      const savedDocument = await this.documentRepository.save(document);

      try {
        const job = await this.jobsService.create({
          documentId: savedDocument.id,
          type: JobType.FULL_PROCESS,
        });

        await this.queueService.addProcessingJob(savedDocument.id, job.id);

        this.logger.log(
          `Processing job created and queued for document ${savedDocument.id}`,
        );
      } catch (jobError) {
        this.logger.error(
          `Failed to create/queue processing job for document ${savedDocument.id}: ${jobError.message}`,
          jobError.stack,
        );
      }

      return savedDocument;
    } catch (error) {
      this.logger.error(
        `Failed to upload document for project ${projectId}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to upload document: ${error.message}`,
      );
    }
  }
}
