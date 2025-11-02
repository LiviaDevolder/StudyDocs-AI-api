import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import axios from 'axios';

export enum OutputFormat {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  JSON = 'json',
}

export interface DoclingExtractionResult {
  content: string;
  format: OutputFormat;
  metadata?: {
    pages?: number;
    language?: string;
    [key: string]: any;
  };
}

@Injectable()
export class DoclingService {
  private readonly logger = new Logger(DoclingService.name);
  private readonly doclingServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.doclingServiceUrl = this.configService.get<string>(
      'DOCLING_SERVICE_URL',
      'http://localhost:8080',
    );
    this.logger.log(
      `Docling service initialized with URL: ${this.doclingServiceUrl}`,
    );
  }

  async extractText(
    fileBuffer: Buffer,
    fileName: string,
    outputFormat: OutputFormat = OutputFormat.TEXT,
  ): Promise<DoclingExtractionResult> {
    try {
      this.logger.log(
        `Extracting text from file: ${fileName} (format: ${outputFormat})`,
      );

      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: this.getMimeType(fileName),
      });

      const response = await axios.post(
        `${this.doclingServiceUrl}/extract`,
        formData,
        {
          params: { output: outputFormat },
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 120000, // 2 minutes timeout
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      const content =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

      this.logger.log(
        `Successfully extracted ${content.length} characters from ${fileName}`,
      );

      return {
        content,
        format: outputFormat,
        metadata: this.extractMetadata(response.data, outputFormat),
      };
    } catch (error) {
      this.logger.error(
        `Failed to extract text from ${fileName}: ${error.message}`,
      );

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new BadRequestException(
            'Docling service is not available. Please try again later.',
          );
        }
        if (error.response) {
          throw new BadRequestException(
            `Docling service error: ${error.response.statusText}`,
          );
        }
      }

      throw new BadRequestException(
        `Failed to extract text: ${error.message}`,
      );
    }
  }

  async extractTextBatch(
    files: Array<{ buffer: Buffer; fileName: string }>,
    outputFormat: OutputFormat = OutputFormat.TEXT,
  ): Promise<DoclingExtractionResult[]> {
    this.logger.log(`Batch extracting text from ${files.length} files`);

    const results = await Promise.allSettled(
      files.map((file) =>
        this.extractText(file.buffer, file.fileName, outputFormat),
      ),
    );

    const successful = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<DoclingExtractionResult>).value);

    const failed = results.filter((r) => r.status === 'rejected');

    if (failed.length > 0) {
      this.logger.warn(
        `${failed.length} out of ${files.length} files failed to process`,
      );
    }

    return successful;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.doclingServiceUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.error(`Docling health check failed: ${error.message}`);
      return false;
    }
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      md: 'text/markdown',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      tiff: 'image/tiff',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private extractMetadata(
    data: any,
    format: OutputFormat,
  ): Record<string, any> {
    if (format === OutputFormat.JSON && typeof data === 'object') {
      return {
        pages: data.pages?.length || data.page_count,
        language: data.language,
        documentType: data.type,
      };
    }
    return {};
  }
}
