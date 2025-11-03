import { Injectable, Logger } from '@nestjs/common';
import { DoclingOcrService } from './docling-ocr.service';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export interface TextExtractionResult {
  text: string;
  method: 'docling-ocr' | 'pdf-parse' | 'mammoth' | 'plain-text';
  metadata?: {
    pages?: number;
    wordCount?: number;
    charCount?: number;
    [key: string]: any;
  };
}

@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);

  constructor(private readonly doclingOcrService: DoclingOcrService) {}

  async extractText(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<TextExtractionResult> {
    this.logger.log(`Extracting text from: ${filename} (${mimeType})`);

    try {
      const ocrResult = await this.doclingOcrService.processDocument(
        buffer,
        filename,
        mimeType,
      );

      return {
        text: ocrResult.text,
        method: 'docling-ocr',
        metadata: {
          pages: ocrResult.pages,
          wordCount: this.countWords(ocrResult.text),
          charCount: ocrResult.text.length,
          ...ocrResult.metadata,
        },
      };
    } catch (ocrError) {
      this.logger.warn(
        `Docling OCR failed for ${filename}, trying fallback methods: ${ocrError.message}`,
      );

      return await this.extractWithFallback(buffer, filename, mimeType);
    }
  }

  private async extractWithFallback(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<TextExtractionResult> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPdf(buffer);

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromDocx(buffer);

        case 'text/plain':
        case 'text/markdown':
          return this.extractFromPlainText(buffer);

        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      this.logger.error(
        `All extraction methods failed for ${filename}: ${error.message}`,
      );
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  private async extractFromPdf(buffer: Buffer): Promise<TextExtractionResult> {
    try {
      this.logger.log('Extracting text from PDF using pdf-parse');
      const data = await pdfParse(buffer);

      return {
        text: data.text,
        method: 'pdf-parse',
        metadata: {
          pages: data.numpages,
          wordCount: this.countWords(data.text),
          charCount: data.text.length,
          info: data.info,
        },
      };
    } catch (error) {
      this.logger.error(`PDF extraction failed: ${error.message}`);
      throw error;
    }
  }

  private async extractFromDocx(
    buffer: Buffer,
  ): Promise<TextExtractionResult> {
    try {
      this.logger.log('Extracting text from DOCX using mammoth');
      const result = await mammoth.extractRawText({ buffer });

      return {
        text: result.value,
        method: 'mammoth',
        metadata: {
          wordCount: this.countWords(result.value),
          charCount: result.value.length,
          messages: result.messages,
        },
      };
    } catch (error) {
      this.logger.error(`DOCX extraction failed: ${error.message}`);
      throw error;
    }
  }

  private extractFromPlainText(buffer: Buffer): TextExtractionResult {
    this.logger.log('Reading plain text file');
    const text = buffer.toString('utf-8');

    return {
      text,
      method: 'plain-text',
      metadata: {
        wordCount: this.countWords(text),
        charCount: text.length,
      },
    };
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  isTextValid(text: string, minLength: number = 10): boolean {
    if (!text || text.trim().length < minLength) {
      return false;
    }

    const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
    return alphanumericCount > minLength / 2;
  }
}
