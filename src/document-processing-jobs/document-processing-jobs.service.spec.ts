/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DocumentProcessingJobsService } from './document-processing-jobs.service';
import {
  DocumentProcessingJob,
  JobStatus,
  JobType,
} from './entities/document-processing-job.entity';
import { CreateDocumentProcessingJobDto } from './dto/create-document-processing-job.dto';
import { UpdateDocumentProcessingJobDto } from './dto/update-document-processing-job.dto';
import { createMockRepository } from '../../test';

describe('DocumentProcessingJobsService', () => {
  let service: DocumentProcessingJobsService;
  let repository: jest.Mocked<Repository<DocumentProcessingJob>>;

  beforeEach(() => {
    repository = createMockRepository<DocumentProcessingJob>();
    service = new DocumentProcessingJobsService(repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new document processing job', async () => {
      // Arrange
      const createDto: CreateDocumentProcessingJobDto = {
        documentId: 'doc-123',
        type: JobType.FULL_PROCESS,
      };
      const savedJob = {
        id: 'job-1',
        ...createDto,
        status: JobStatus.PENDING,
        progress: 0,
        createdAt: new Date(),
      } as DocumentProcessingJob;

      repository.create.mockReturnValue(savedJob);
      repository.save.mockResolvedValue(savedJob);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toEqual(savedJob);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(savedJob);
    });
  });

  describe('findAll', () => {
    it('should return all jobs with document relation', async () => {
      // Arrange
      const jobs = [
        { id: '1', status: JobStatus.PENDING },
        { id: '2', status: JobStatus.PROCESSING },
      ] as DocumentProcessingJob[];

      repository.find.mockResolvedValue(jobs);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(jobs);
      expect(result).toHaveLength(2);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['document'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no jobs exist', async () => {
      // Arrange
      repository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a job by id', async () => {
      // Arrange
      const job = {
        id: 'job-1',
        status: JobStatus.PENDING,
      } as DocumentProcessingJob;

      repository.findOne.mockResolvedValue(job);

      // Act
      const result = await service.findOne('job-1');

      // Assert
      expect(result).toEqual(job);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        relations: ['document'],
      });
    });

    it('should throw NotFoundException when job not found', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'DocumentProcessingJob with ID nonexistent not found',
      );
    });
  });

  describe('findByDocumentId', () => {
    it('should return jobs for a specific document', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobs = [
        { id: '1', documentId, status: JobStatus.COMPLETED },
        { id: '2', documentId, status: JobStatus.PENDING },
      ] as DocumentProcessingJob[];

      repository.find.mockResolvedValue(jobs);

      // Act
      const result = await service.findByDocumentId(documentId);

      // Assert
      expect(result).toEqual(jobs);
      expect(result).toHaveLength(2);
      expect(repository.find).toHaveBeenCalledWith({
        where: { documentId },
        relations: ['document'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when document has no jobs', async () => {
      // Arrange
      repository.find.mockResolvedValue([]);

      // Act
      const result = await service.findByDocumentId('doc-empty');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should return jobs with specific status', async () => {
      // Arrange
      const jobs = [
        { id: '1', status: JobStatus.PROCESSING },
        { id: '2', status: JobStatus.PROCESSING },
      ] as DocumentProcessingJob[];

      repository.find.mockResolvedValue(jobs);

      // Act
      const result = await service.findByStatus(JobStatus.PROCESSING);

      // Assert
      expect(result).toEqual(jobs);
      expect(repository.find).toHaveBeenCalledWith({
        where: { status: JobStatus.PROCESSING },
        relations: ['document'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findPendingJobs', () => {
    it('should return pending jobs', async () => {
      // Arrange
      const jobs = [
        { id: '1', status: JobStatus.PENDING },
      ] as DocumentProcessingJob[];

      repository.find.mockResolvedValue(jobs);

      // Act
      const result = await service.findPendingJobs();

      // Assert
      expect(result).toEqual(jobs);
      expect(repository.find).toHaveBeenCalledWith({
        where: { status: JobStatus.PENDING },
        relations: ['document'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findProcessingJobs', () => {
    it('should return processing jobs', async () => {
      // Arrange
      const jobs = [
        { id: '1', status: JobStatus.PROCESSING },
      ] as DocumentProcessingJob[];

      repository.find.mockResolvedValue(jobs);

      // Act
      const result = await service.findProcessingJobs();

      // Assert
      expect(result).toEqual(jobs);
    });
  });

  describe('update', () => {
    it('should update a job', async () => {
      // Arrange
      const updateDto: UpdateDocumentProcessingJobDto = {
        progress: 50,
        currentStep: 'Processing chunks',
      };
      const existingJob = {
        id: '1',
        progress: 0,
      } as Partial<DocumentProcessingJob> as DocumentProcessingJob;
      const updatedJob = {
        ...existingJob,
        ...updateDto,
      } as DocumentProcessingJob;

      jest.spyOn(service, 'findOne').mockResolvedValue(existingJob);
      repository.save.mockResolvedValue(updatedJob);

      // Act
      const result = await service.update('1', updateDto);

      // Assert
      expect(result.progress).toBe(50);
      expect(result.currentStep).toBe('Processing chunks');
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(repository.save).toHaveBeenCalledWith(updatedJob);
    });

    it('should throw NotFoundException when updating non-existent job', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(
        service.update('nonexistent', { progress: 50 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProgress', () => {
    it('should update job progress', async () => {
      // Arrange
      const job = {
        id: '1',
        progress: 0,
      } as Partial<DocumentProcessingJob> as DocumentProcessingJob;
      const updatedJob = { ...job, progress: 75, currentStep: 'Embedding' };

      jest.spyOn(service, 'findOne').mockResolvedValue(job);
      repository.save.mockResolvedValue(updatedJob);

      // Act
      const result = await service.updateProgress('1', 75, 'Embedding');

      // Assert
      expect(result.progress).toBe(75);
      expect(result.currentStep).toBe('Embedding');
    });

    it('should update progress without changing current step', async () => {
      // Arrange
      const job = {
        id: '1',
        progress: 50,
        currentStep: 'Chunking',
      } as DocumentProcessingJob;
      const updatedJob = { ...job, progress: 60 };

      jest.spyOn(service, 'findOne').mockResolvedValue(job);
      repository.save.mockResolvedValue(updatedJob);

      // Act
      const result = await service.updateProgress('1', 60);

      // Assert
      expect(result.progress).toBe(60);
    });
  });

  describe('startJob', () => {
    it('should start a pending job', async () => {
      // Arrange
      const job = {
        id: '1',
        status: JobStatus.PENDING,
        progress: 0,
      } as Partial<DocumentProcessingJob> as DocumentProcessingJob;
      const startedJob = {
        ...job,
        status: JobStatus.PROCESSING,
        startedAt: new Date(),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(job);
      repository.save.mockResolvedValue(startedJob);

      // Act
      const result = await service.startJob('1');

      // Assert
      expect(result.status).toBe(JobStatus.PROCESSING);
      expect(result.startedAt).toBeDefined();
      expect(result.progress).toBe(0);
    });
  });

  describe('completeJob', () => {
    it('should complete a job', async () => {
      // Arrange
      const job = {
        id: '1',
        status: JobStatus.PROCESSING,
        progress: 99,
      } as Partial<DocumentProcessingJob> as DocumentProcessingJob;
      const completedJob = {
        ...job,
        status: JobStatus.COMPLETED,
        progress: 100,
        completedAt: new Date(),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(job);
      repository.save.mockResolvedValue(completedJob);

      // Act
      const result = await service.completeJob('1');

      // Assert
      expect(result.status).toBe(JobStatus.COMPLETED);
      expect(result.progress).toBe(100);
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('failJob', () => {
    it('should fail a job with error message', async () => {
      // Arrange
      const job = {
        id: '1',
        status: JobStatus.PROCESSING,
      } as Partial<DocumentProcessingJob> as DocumentProcessingJob;
      const failedJob = {
        ...job,
        status: JobStatus.FAILED,
        errorMessage: 'Processing failed',
        errorStack: 'Error stack trace',
        completedAt: new Date(),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(job);
      repository.save.mockResolvedValue(failedJob);

      // Act
      const result = await service.failJob(
        '1',
        'Processing failed',
        'Error stack trace',
      );

      // Assert
      expect(result.status).toBe(JobStatus.FAILED);
      expect(result.errorMessage).toBe('Processing failed');
      expect(result.errorStack).toBe('Error stack trace');
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('cancelJob', () => {
    it('should cancel a pending or processing job', async () => {
      // Arrange
      const job = {
        id: '1',
        status: JobStatus.PROCESSING,
      } as Partial<DocumentProcessingJob> as DocumentProcessingJob;
      const cancelledJob = {
        ...job,
        status: JobStatus.CANCELLED,
        completedAt: new Date(),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(job);
      repository.save.mockResolvedValue(cancelledJob);

      // Act
      const result = await service.cancelJob('1');

      // Assert
      expect(result.status).toBe(JobStatus.CANCELLED);
      expect(result.completedAt).toBeDefined();
    });

    it('should throw error when trying to cancel completed job', async () => {
      // Arrange
      const job = {
        id: '1',
        status: JobStatus.COMPLETED,
      } as DocumentProcessingJob;

      jest.spyOn(service, 'findOne').mockResolvedValue(job);

      // Act & Assert
      await expect(service.cancelJob('1')).rejects.toThrow(
        'Cannot cancel a completed or failed job',
      );
    });

    it('should throw error when trying to cancel failed job', async () => {
      // Arrange
      const job = {
        id: '1',
        status: JobStatus.FAILED,
      } as DocumentProcessingJob;

      jest.spyOn(service, 'findOne').mockResolvedValue(job);

      // Act & Assert
      await expect(service.cancelJob('1')).rejects.toThrow(
        'Cannot cancel a completed or failed job',
      );
    });
  });

  describe('remove', () => {
    it('should remove a job', async () => {
      // Arrange
      const job = {
        id: '1',
        status: JobStatus.COMPLETED,
      } as DocumentProcessingJob;

      jest.spyOn(service, 'findOne').mockResolvedValue(job);
      repository.remove.mockResolvedValue(job);

      // Act
      const result = await service.remove('1');

      // Assert
      expect(result).toEqual(job);
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(repository.remove).toHaveBeenCalledWith(job);
    });

    it('should throw NotFoundException when removing non-existent job', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getJobProgress', () => {
    it('should return job progress information', async () => {
      // Arrange
      const job = {
        id: '1',
        progress: 75,
        currentStep: 'Creating embeddings',
        status: JobStatus.PROCESSING,
      } as DocumentProcessingJob;

      jest.spyOn(service, 'findOne').mockResolvedValue(job);

      // Act
      const result = await service.getJobProgress('1');

      // Assert
      expect(result).toEqual({
        progress: 75,
        currentStep: 'Creating embeddings',
        status: JobStatus.PROCESSING,
      });
    });
  });
});
