import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { DocumentProcessingJobsService } from './document-processing-jobs.service';
import {
  DocumentProcessingJob,
  JobStatus,
} from './entities/document-processing-job.entity';
import { CreateDocumentProcessingJobDto } from './dto/create-document-processing-job.dto';
import { UpdateDocumentProcessingJobDto } from './dto/update-document-processing-job.dto';

@Resolver(() => DocumentProcessingJob)
export class DocumentProcessingJobsResolver {
  constructor(
    private readonly documentProcessingJobsService: DocumentProcessingJobsService,
  ) {}

  @Mutation(() => DocumentProcessingJob, {
    description: 'Create a new document processing job',
  })
  createDocumentProcessingJob(
    @Args('input') createDto: CreateDocumentProcessingJobDto,
  ): Promise<DocumentProcessingJob> {
    return this.documentProcessingJobsService.create(createDto);
  }

  @Query(() => [DocumentProcessingJob], {
    name: 'documentProcessingJobs',
    description: 'Get all document processing jobs',
  })
  findAll(): Promise<DocumentProcessingJob[]> {
    return this.documentProcessingJobsService.findAll();
  }

  @Query(() => DocumentProcessingJob, {
    name: 'documentProcessingJob',
    description: 'Get a single document processing job by ID',
  })
  findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DocumentProcessingJob> {
    return this.documentProcessingJobsService.findOne(id);
  }

  @Query(() => [DocumentProcessingJob], {
    name: 'documentProcessingJobsByDocument',
    description: 'Get all processing jobs for a specific document',
  })
  findByDocumentId(
    @Args('documentId', { type: () => ID }) documentId: string,
  ): Promise<DocumentProcessingJob[]> {
    return this.documentProcessingJobsService.findByDocumentId(documentId);
  }

  @Query(() => [DocumentProcessingJob], {
    name: 'documentProcessingJobsByStatus',
    description: 'Get all jobs with a specific status',
  })
  findByStatus(
    @Args('status', { type: () => JobStatus }) status: JobStatus,
  ): Promise<DocumentProcessingJob[]> {
    return this.documentProcessingJobsService.findByStatus(status);
  }

  @Query(() => [DocumentProcessingJob], {
    name: 'pendingDocumentProcessingJobs',
    description: 'Get all pending jobs',
  })
  findPendingJobs(): Promise<DocumentProcessingJob[]> {
    return this.documentProcessingJobsService.findPendingJobs();
  }

  @Query(() => [DocumentProcessingJob], {
    name: 'processingDocumentProcessingJobs',
    description: 'Get all currently processing jobs',
  })
  findProcessingJobs(): Promise<DocumentProcessingJob[]> {
    return this.documentProcessingJobsService.findProcessingJobs();
  }

  @Mutation(() => DocumentProcessingJob, {
    description: 'Update a document processing job',
  })
  updateDocumentProcessingJob(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateDto: UpdateDocumentProcessingJobDto,
  ): Promise<DocumentProcessingJob> {
    return this.documentProcessingJobsService.update(id, updateDto);
  }

  @Mutation(() => DocumentProcessingJob, {
    description: 'Start a pending job',
  })
  startDocumentProcessingJob(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DocumentProcessingJob> {
    return this.documentProcessingJobsService.startJob(id);
  }

  @Mutation(() => DocumentProcessingJob, {
    description: 'Complete a job',
  })
  completeDocumentProcessingJob(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DocumentProcessingJob> {
    return this.documentProcessingJobsService.completeJob(id);
  }

  @Mutation(() => DocumentProcessingJob, {
    description: 'Mark a job as failed',
  })
  failDocumentProcessingJob(
    @Args('id', { type: () => ID }) id: string,
    @Args('errorMessage') errorMessage: string,
    @Args('errorStack', { nullable: true }) errorStack?: string,
  ): Promise<DocumentProcessingJob> {
    return this.documentProcessingJobsService.failJob(
      id,
      errorMessage,
      errorStack,
    );
  }

  @Mutation(() => DocumentProcessingJob, {
    description: 'Cancel a job',
  })
  cancelDocumentProcessingJob(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DocumentProcessingJob> {
    return this.documentProcessingJobsService.cancelJob(id);
  }

  @Mutation(() => DocumentProcessingJob, {
    description: 'Remove a document processing job',
  })
  removeDocumentProcessingJob(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DocumentProcessingJob> {
    return this.documentProcessingJobsService.remove(id);
  }
}
