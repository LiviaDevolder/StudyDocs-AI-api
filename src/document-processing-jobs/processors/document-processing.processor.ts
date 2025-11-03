import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DocumentProcessingJobData } from '../interfaces/document-processing-job.interface';
import { DocumentProcessingJobsService } from '../document-processing-jobs.service';
import { GcsService } from '../../common/services/gcs.service';
import { TextExtractionService } from '../../common/services/text-extraction.service';
import { ChunkingService } from '../../common/services/chunking.service';
import { EmbeddingsService } from '../../common/services/embeddings.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../../documents/entities/document.entity';
import { DocumentChunk } from '../../document-chunks/entities/document-chunk.entity';
import { DocumentStatus } from '../../documents/entities/document.entity';
import { ConfigService } from '@nestjs/config';

@Processor('document-processing')
export class DocumentProcessingProcessor {
  private readonly logger = new Logger(DocumentProcessingProcessor.name);

  constructor(
    private readonly jobsService: DocumentProcessingJobsService,
    private readonly gcsService: GcsService,
    private readonly textExtractionService: TextExtractionService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly configService: ConfigService,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private readonly chunkRepository: Repository<DocumentChunk>,
  ) {}

  @Process('process-document')
  async processDocument(job: Job<DocumentProcessingJobData>) {
    const { documentId, jobId } = job.data;

    this.logger.log(
      `Starting document processing: ${documentId} (job: ${jobId})`,
    );

    try {
      // Update job status to PROCESSING
      await this.jobsService.startJob(jobId);
      await job.progress(5);

      // 1. Get document from database
      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      this.logger.log(`Processing document: ${document.name}`);

      // 2. Download file from GCS
      await this.jobsService.updateProgress(
        jobId,
        10,
        'Downloading file from GCS',
      );
      await job.progress(10);

      const fileBuffer = await this.gcsService.downloadFile(document.gcsPath);

      // 3. Extract text
      await this.jobsService.updateProgress(
        jobId,
        20,
        'Extracting text from document',
      );
      await job.progress(20);

      const extractionResult = await this.textExtractionService.extractText(
        fileBuffer,
        document.name,
        document.type,
      );

      if (!extractionResult.text || extractionResult.text.trim().length === 0) {
        throw new Error('No text could be extracted from document');
      }

      this.logger.log(
        `Text extracted (${extractionResult.method}): ${extractionResult.text.length} characters`,
      );

      // 4. Chunk the text
      await this.jobsService.updateProgress(
        jobId,
        40,
        'Chunking document text',
      );
      await job.progress(40);

      const chunks = this.chunkingService.chunkText(extractionResult.text, {
        maxChunkSize: 1000,
        overlap: 200,
        preserveParagraphs: true,
        preserveSentences: true,
      });

      this.logger.log(`Document chunked into ${chunks.length} chunks`);

      await this.jobsService.update(jobId, {
        totalChunks: chunks.length,
      });

      // 5. Generate embeddings for each chunk
      await this.jobsService.updateProgress(
        jobId,
        50,
        `Generating embeddings for ${chunks.length} chunks`,
      );
      await job.progress(50);

      const batchSize = this.configService.get<number>(
        'PROCESSING_BATCH_SIZE',
        5,
      );
      const textsToEmbed = chunks.map((c) => c.content);

      const { embeddings } =
        await this.embeddingsService.generateEmbeddingsBatch(
          textsToEmbed,
          batchSize,
        );

      if (embeddings.length !== chunks.length) {
        this.logger.warn(
          `Embedding count mismatch: ${embeddings.length} embeddings for ${chunks.length} chunks`,
        );
      }

      // 6. Save chunks to database
      await this.jobsService.updateProgress(
        jobId,
        80,
        'Saving chunks to database',
      );
      await job.progress(80);

      const chunkEntities = chunks.map((chunk, index) => {
        const chunkEntity = this.chunkRepository.create({
          documentId: document.id,
          content: chunk.content,
          embedding: embeddings[index]?.embedding || null,
          metadata: {
            ...chunk.metadata,
            extractionMethod: extractionResult.method,
            index: chunk.index,
            startPosition: chunk.startPosition,
            endPosition: chunk.endPosition,
          },
        });

        return chunkEntity;
      });

      await this.chunkRepository.save(chunkEntities);

      this.logger.log(`Saved ${chunkEntities.length} chunks to database`);

      // 7. Update document status
      await this.jobsService.updateProgress(jobId, 95, 'Finalizing');
      await job.progress(95);

      await this.documentRepository.update(document.id, {
        status: DocumentStatus.COMPLETED,
      });

      // 8. Complete job
      await this.jobsService.completeJob(jobId);
      await job.progress(100);

      this.logger.log(
        `Document processing completed successfully: ${documentId}`,
      );

      return {
        documentId,
        chunks: chunkEntities.length,
        method: extractionResult.method,
        charCount: extractionResult.text.length,
      };
    } catch (error) {
      this.logger.error(
        `Document processing failed for ${documentId}: ${error.message}`,
        error.stack,
      );

      // Update job status to FAILED
      await this.jobsService.failJob(jobId, error.message, error.stack);

      // Update document status to FAILED
      await this.documentRepository.update(documentId, {
        status: DocumentStatus.FAILED,
      });

      throw error;
    }
  }
}
