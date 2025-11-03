import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { DocumentProcessingJobsService } from './document-processing-jobs.service';
import { DocumentProcessingJobsResolver } from './document-processing-jobs.resolver';
import { DocumentProcessingJob } from './entities/document-processing-job.entity';
import { Document } from '../documents/entities/document.entity';
import { DocumentChunk } from '../document-chunks/entities/document-chunk.entity';
import { DocumentProcessingProcessor } from './processors/document-processing.processor';
import { DocumentProcessingQueueService } from './services/document-processing-queue.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentProcessingJob, Document, DocumentChunk]),
    BullModule.registerQueue({
      name: 'document-processing',
    }),
    CommonModule,
  ],
  providers: [
    DocumentProcessingJobsService,
    DocumentProcessingJobsResolver,
    DocumentProcessingProcessor,
    DocumentProcessingQueueService,
  ],
  exports: [DocumentProcessingJobsService, DocumentProcessingQueueService],
})
export class DocumentProcessingJobsModule {}
