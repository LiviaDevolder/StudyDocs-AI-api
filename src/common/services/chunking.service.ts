import { Injectable, Logger } from '@nestjs/common';

export interface ChunkOptions {
  maxChunkSize?: number; // Maximum characters per chunk
  overlap?: number; // Overlap between chunks in characters
  preserveParagraphs?: boolean; // Try to preserve paragraph boundaries
  preserveSentences?: boolean; // Try to preserve sentence boundaries
}

export interface TextChunk {
  content: string;
  index: number;
  startPosition: number;
  endPosition: number;
  metadata?: {
    paragraphIndex?: number;
    sentenceCount?: number;
    wordCount?: number;
    [key: string]: any;
  };
}

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  chunkText(
    text: string,
    options: ChunkOptions = {},
  ): TextChunk[] {
    const {
      maxChunkSize = 1000,
      overlap = 200,
      preserveParagraphs = true,
      preserveSentences = true,
    } = options;

    this.logger.log(
      `Chunking text (${text.length} chars) with max size ${maxChunkSize} and overlap ${overlap}`,
    );

    const cleanText = this.cleanText(text);

    if (preserveParagraphs) {
      return this.chunkByParagraphs(cleanText, maxChunkSize, overlap);
    }

    if (preserveSentences) {
      return this.chunkBySentences(cleanText, maxChunkSize, overlap);
    }

    return this.chunkByCharacters(cleanText, maxChunkSize, overlap);
  }

  private chunkByParagraphs(
    text: string,
    maxSize: number,
    overlap: number,
  ): TextChunk[] {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let currentStartPos = 0;
    let chunkIndex = 0;
    let paragraphIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();
      if (!trimmedPara) continue;

      if (trimmedPara.length > maxSize) {
        if (currentChunk) {
          chunks.push(this.createChunk(currentChunk, chunkIndex++, currentStartPos));
          currentChunk = '';
        }

        const sentenceChunks = this.chunkBySentences(trimmedPara, maxSize, overlap);
        sentenceChunks.forEach((chunk) => {
          chunks.push({
            ...chunk,
            index: chunkIndex++,
            startPosition: currentStartPos + chunk.startPosition,
            metadata: {
              ...chunk.metadata,
              paragraphIndex,
            },
          });
        });

        currentStartPos += trimmedPara.length + 2; // +2 for \n\n
        paragraphIndex++;
        continue;
      }

      if (currentChunk.length + trimmedPara.length + 2 > maxSize && currentChunk) {
        chunks.push(
          this.createChunk(currentChunk, chunkIndex++, currentStartPos, {
            paragraphIndex: paragraphIndex - 1,
          }),
        );

        const overlapText = this.getOverlapText(currentChunk, overlap);
        currentChunk = overlapText ? overlapText + '\n\n' : '';
        currentStartPos += currentChunk.length - overlapText.length;
      }

      currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
      paragraphIndex++;
    }

    if (currentChunk) {
      chunks.push(
        this.createChunk(currentChunk, chunkIndex, currentStartPos, {
          paragraphIndex,
        }),
      );
    }

    this.logger.log(`Created ${chunks.length} chunks from text`);
    return chunks;
  }

  private chunkBySentences(
    text: string,
    maxSize: number,
    overlap: number,
  ): TextChunk[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let currentStartPos = 0;
    let chunkIndex = 0;
    let sentenceCount = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      if (trimmedSentence.length > maxSize) {
        if (currentChunk) {
          chunks.push(
            this.createChunk(currentChunk, chunkIndex++, currentStartPos, {
              sentenceCount,
            }),
          );
          currentChunk = '';
          sentenceCount = 0;
        }

        const charChunks = this.chunkByCharacters(trimmedSentence, maxSize, overlap);
        charChunks.forEach((chunk) => {
          chunks.push({
            ...chunk,
            index: chunkIndex++,
            startPosition: currentStartPos + chunk.startPosition,
          });
        });

        currentStartPos += trimmedSentence.length + 1;
        continue;
      }

      if (currentChunk.length + trimmedSentence.length + 1 > maxSize && currentChunk) {
        chunks.push(
          this.createChunk(currentChunk, chunkIndex++, currentStartPos, {
            sentenceCount,
          }),
        );

        const overlapText = this.getOverlapText(currentChunk, overlap);
        currentChunk = overlapText ? overlapText + ' ' : '';
        currentStartPos += currentChunk.length - overlapText.length;
        sentenceCount = 0;
      }

      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      sentenceCount++;
    }

    if (currentChunk) {
      chunks.push(
        this.createChunk(currentChunk, chunkIndex, currentStartPos, {
          sentenceCount,
        }),
      );
    }

    return chunks;
  }

  private chunkByCharacters(
    text: string,
    maxSize: number,
    overlap: number,
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    let startPos = 0;
    let chunkIndex = 0;

    while (startPos < text.length) {
      const endPos = Math.min(startPos + maxSize, text.length);
      const chunkText = text.slice(startPos, endPos);

      chunks.push(this.createChunk(chunkText, chunkIndex++, startPos));

      startPos = endPos - overlap;
      if (startPos >= text.length) break;
    }

    return chunks;
  }

  private createChunk(
    content: string,
    index: number,
    startPosition: number,
    additionalMetadata: Record<string, any> = {},
  ): TextChunk {
    return {
      content: content.trim(),
      index,
      startPosition,
      endPosition: startPosition + content.length,
      metadata: {
        wordCount: this.countWords(content),
        sentenceCount: this.countSentences(content),
        ...additionalMetadata,
      },
    };
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (overlapSize <= 0 || overlapSize >= text.length) return '';

    const overlapText = text.slice(-overlapSize);
    const firstSpace = overlapText.indexOf(' ');

    if (firstSpace > 0) {
      return overlapText.slice(firstSpace + 1);
    }

    return overlapText;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/ +/g, ' ') // Collapse multiple spaces
      .trim();
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  private countSentences(text: string): number {
    return (text.match(/[.!?]+/g) || []).length;
  }

  chunkMarkdown(
    markdown: string,
    options: ChunkOptions = {},
  ): TextChunk[] {
    const { maxChunkSize = 1000, overlap = 200 } = options;

    this.logger.log(`Chunking markdown text (${markdown.length} chars)`);

    const sections = this.splitByHeaders(markdown);
    const chunks: TextChunk[] = [];
    let chunkIndex = 0;
    let currentStartPos = 0;

    for (const section of sections) {
      if (section.length <= maxChunkSize) {
        chunks.push(
          this.createChunk(section, chunkIndex++, currentStartPos, {
            type: 'markdown-section',
          }),
        );
        currentStartPos += section.length;
      } else {
        const sectionChunks = this.chunkByParagraphs(
          section,
          maxChunkSize,
          overlap,
        );
        sectionChunks.forEach((chunk) => {
          chunks.push({
            ...chunk,
            index: chunkIndex++,
            startPosition: currentStartPos + chunk.startPosition,
            metadata: {
              ...chunk.metadata,
              type: 'markdown-section',
            },
          });
        });
        currentStartPos += section.length;
      }
    }

    return chunks;
  }

  private splitByHeaders(markdown: string): string[] {
    const lines = markdown.split('\n');
    const sections: string[] = [];
    let currentSection = '';

    for (const line of lines) {
      if (line.match(/^#{1,6}\s/)) {
        if (currentSection.trim()) {
          sections.push(currentSection.trim());
        }
        currentSection = line + '\n';
      } else {
        currentSection += line + '\n';
      }
    }

    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }

    return sections.filter((s) => s.length > 0);
  }
}
