import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DocumentProcessingJobData } from '../interfaces/document-processing-job.interface';

@Injectable()
export class DocumentProcessingQueueService {
  private readonly logger = new Logger(DocumentProcessingQueueService.name);

  constructor(
    @InjectQueue('document-processing')
    private readonly documentQueue: Queue<DocumentProcessingJobData>,
  ) {}

  async addProcessingJob(documentId: string, jobId: string): Promise<void> {
    try {
      this.logger.log(`Adding document ${documentId} to processing queue`);

      await this.documentQueue.add(
        'process-document',
        {
          documentId,
          jobId,
        },
        {
          attempts: 3, // Retry up to 3 times
          backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5 second delay
          },
          removeOnComplete: false, // Keep completed jobs for monitoring
          removeOnFail: false, // Keep failed jobs for debugging
        },
      );

      this.logger.log(
        `Document ${documentId} added to queue successfully (job: ${jobId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add document ${documentId} to queue: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.documentQueue.getWaitingCount(),
      this.documentQueue.getActiveCount(),
      this.documentQueue.getCompletedCount(),
      this.documentQueue.getFailedCount(),
      this.documentQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async cleanOldJobs(olderThanMs: number = 7 * 24 * 60 * 60 * 1000) {
    // 7 days
    try {
      await this.documentQueue.clean(olderThanMs, 'completed');
      await this.documentQueue.clean(olderThanMs, 'failed');
      this.logger.log('Old jobs cleaned successfully');
    } catch (error) {
      this.logger.error(`Failed to clean old jobs: ${error.message}`);
    }
  }

  async pauseQueue(): Promise<void> {
    await this.documentQueue.pause();
    this.logger.log('Document processing queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.documentQueue.resume();
    this.logger.log('Document processing queue resumed');
  }
}
