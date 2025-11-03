import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsResolver } from './documents.resolver';
import { Document } from './entities/document.entity';
import { Project } from '../projects/entities/project.entity';
import { CommonModule } from '../common/common.module';
import { DocumentProcessingJobsModule } from '../document-processing-jobs/document-processing-jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Project]),
    CommonModule,
    DocumentProcessingJobsModule,
  ],
  providers: [DocumentsResolver, DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
