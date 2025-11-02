import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentProcessingJobDto } from './dto/create-document-processing-job.dto';
import { UpdateDocumentProcessingJobDto } from './dto/update-document-processing-job.dto';
import {
  DocumentProcessingJob,
  JobStatus,
} from './entities/document-processing-job.entity';

@Injectable()
export class DocumentProcessingJobsService {
  constructor(
    @InjectRepository(DocumentProcessingJob)
    private readonly jobRepository: Repository<DocumentProcessingJob>,
  ) {}

  async create(
    createDto: CreateDocumentProcessingJobDto,
  ): Promise<DocumentProcessingJob> {
    const job = this.jobRepository.create(createDto);
    return await this.jobRepository.save(job);
  }

  async findAll(): Promise<DocumentProcessingJob[]> {
    return await this.jobRepository.find({
      relations: ['document'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DocumentProcessingJob> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['document'],
    });

    if (!job) {
      throw new NotFoundException(
        `DocumentProcessingJob with ID ${id} not found`,
      );
    }

    return job;
  }

  async findByDocumentId(documentId: string): Promise<DocumentProcessingJob[]> {
    return await this.jobRepository.find({
      where: { documentId },
      relations: ['document'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: JobStatus): Promise<DocumentProcessingJob[]> {
    return await this.jobRepository.find({
      where: { status },
      relations: ['document'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingJobs(): Promise<DocumentProcessingJob[]> {
    return await this.findByStatus(JobStatus.PENDING);
  }

  async findProcessingJobs(): Promise<DocumentProcessingJob[]> {
    return await this.findByStatus(JobStatus.PROCESSING);
  }

  async update(
    id: string,
    updateDto: UpdateDocumentProcessingJobDto,
  ): Promise<DocumentProcessingJob> {
    const job = await this.findOne(id);
    Object.assign(job, updateDto);
    return await this.jobRepository.save(job);
  }

  async updateProgress(
    id: string,
    progress: number,
    currentStep?: string,
  ): Promise<DocumentProcessingJob> {
    const job = await this.findOne(id);
    job.progress = progress;
    if (currentStep) {
      job.currentStep = currentStep;
    }
    return await this.jobRepository.save(job);
  }

  async startJob(id: string): Promise<DocumentProcessingJob> {
    const job = await this.findOne(id);
    job.status = JobStatus.PROCESSING;
    job.startedAt = new Date();
    job.progress = 0;
    return await this.jobRepository.save(job);
  }

  async completeJob(id: string): Promise<DocumentProcessingJob> {
    const job = await this.findOne(id);
    job.status = JobStatus.COMPLETED;
    job.progress = 100;
    job.completedAt = new Date();
    return await this.jobRepository.save(job);
  }

  async failJob(
    id: string,
    errorMessage: string,
    errorStack?: string,
  ): Promise<DocumentProcessingJob> {
    const job = await this.findOne(id);
    job.status = JobStatus.FAILED;
    job.errorMessage = errorMessage;
    if (errorStack) {
      job.errorStack = errorStack;
    }
    job.completedAt = new Date();
    return await this.jobRepository.save(job);
  }

  async cancelJob(id: string): Promise<DocumentProcessingJob> {
    const job = await this.findOne(id);

    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      throw new Error('Cannot cancel a completed or failed job');
    }

    job.status = JobStatus.CANCELLED;
    job.completedAt = new Date();
    return await this.jobRepository.save(job);
  }

  async remove(id: string): Promise<DocumentProcessingJob> {
    const job = await this.findOne(id);
    await this.jobRepository.remove(job);
    return job;
  }

  async getJobProgress(id: string): Promise<{
    progress: number;
    currentStep: string;
    status: JobStatus;
  }> {
    const job = await this.findOne(id);
    return {
      progress: job.progress,
      currentStep: job.currentStep,
      status: job.status,
    };
  }
}
