import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentProcessingJobsService } from './document-processing-jobs.service';
import { DocumentProcessingJobsResolver } from './document-processing-jobs.resolver';
import { DocumentProcessingJob } from './entities/document-processing-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentProcessingJob])],
  providers: [DocumentProcessingJobsService, DocumentProcessingJobsResolver],
  exports: [DocumentProcessingJobsService],
})
export class DocumentProcessingJobsModule {}
