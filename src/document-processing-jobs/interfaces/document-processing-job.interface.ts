export interface DocumentProcessingJobData {
  documentId: string;
  jobId: string;
}

export interface DocumentProcessingProgress {
  progress: number;
  currentStep: string;
  processedChunks?: number;
  totalChunks?: number;
}
