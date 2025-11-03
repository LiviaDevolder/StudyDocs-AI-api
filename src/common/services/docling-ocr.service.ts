import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';

export interface DoclingOCRResult {
  text: string;
  pages?: number;
  metadata?: {
    language?: string;
    confidence?: number;
    [key: string]: any;
  };
}

@Injectable()
export class DoclingOcrService {
  private readonly logger = new Logger(DoclingOcrService.name);
  private readonly ocrUrl: string;
  private readonly apiKey?: string;

  constructor(private configService: ConfigService) {
    this.ocrUrl = this.configService.get<string>('DOCLING_OCR_URL')!;
    this.apiKey = this.configService.get<string>('DOCLING_OCR_API_KEY');

    if (!this.ocrUrl) {
      this.logger.warn(
        'DOCLING_OCR_URL not configured. OCR processing will fail.',
      );
    }

    this.logger.log(`Docling OCR configured: ${this.ocrUrl}`);
  }

  /**
   * Process a document buffer using Docling OCR service
   * @param buffer Document buffer (PDF, image, etc.)
   * @param filename Original filename for context
   * @param mimeType MIME type of the document
   * @returns Extracted text from the document
   */
  async processDocument(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<DoclingOCRResult> {
    try {
      if (!this.ocrUrl) {
        throw new Error('DOCLING_OCR_URL is not configured');
      }

      this.logger.log(`Processing document with Docling OCR: ${filename}`);

      const formData = new FormData();
      formData.append('file', buffer, {
        filename,
        contentType: mimeType,
      });

      const headers: any = {
        ...formData.getHeaders(),
      };

      // Add API key if configured
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await axios.post(`${this.ocrUrl}/process`, formData, {
        headers,
        timeout: 300000, // 5 minutes timeout for large documents
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const text = this.extractTextFromResponse(response.data);

      this.logger.log(
        `Document processed successfully: ${filename} (${text.length} characters)`,
      );

      return {
        text,
        pages: response.data.pages,
        metadata: response.data.metadata,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process document ${filename}: ${error.message}`,
        error.stack,
      );

      // If OCR fails, throw error so we can try fallback methods
      throw new Error(`Docling OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from various response formats
   * Docling might return different formats depending on configuration
   */
  private extractTextFromResponse(data: any): string {
    // Try different response formats
    if (typeof data === 'string') {
      return data;
    }

    if (data.text) {
      return data.text;
    }

    if (data.content) {
      return data.content;
    }

    if (data.markdown) {
      return data.markdown;
    }

    if (data.pages && Array.isArray(data.pages)) {
      return data.pages.map((page: any) => page.text || page.content).join('\n\n');
    }

    // If we can't find text, return empty string
    this.logger.warn('Could not extract text from Docling response, returning empty string');
    return '';
  }

  /**
   * Check if Docling OCR service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.ocrUrl) {
        return false;
      }

      const response = await axios.get(`${this.ocrUrl}/health`, {
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      this.logger.error(`Docling OCR health check failed: ${error.message}`);
      return false;
    }
  }
}
