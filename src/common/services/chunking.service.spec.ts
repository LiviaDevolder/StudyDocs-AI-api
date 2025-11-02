import { Test, TestingModule } from '@nestjs/testing';
import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  let service: ChunkingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChunkingService],
    }).compile();

    service = module.get<ChunkingService>(ChunkingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chunkText', () => {
    it('should split text into chunks by character count', () => {
      const text = 'a'.repeat(2500); // Reduced from 3000
      const chunks = service.chunkText(text, {
        maxChunkSize: 1000,
        overlap: 100,
        preserveParagraphs: false,
        preserveSentences: false,
      });

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].content.length).toBeLessThanOrEqual(1000);
      expect(chunks[0].index).toBe(0);
      expect(chunks[1].index).toBe(1);
    });

    it('should preserve paragraphs when splitting', () => {
      const text = `First paragraph with some content.

Second paragraph with more content.

Third paragraph with even more content.`;

      const chunks = service.chunkText(text, {
        maxChunkSize: 100,
        overlap: 20,
        preserveParagraphs: true,
      });

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((chunk) => {
        expect(chunk.metadata?.paragraphIndex).toBeDefined();
      });
    });

    it('should preserve sentences when splitting', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';

      const chunks = service.chunkText(text, {
        maxChunkSize: 40,
        overlap: 10,
        preserveSentences: true,
        preserveParagraphs: false,
      });

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((chunk) => {
        expect(chunk.metadata?.sentenceCount).toBeGreaterThan(0);
      });
    });

    it('should handle empty text', () => {
      const chunks = service.chunkText('', { maxChunkSize: 1000 });
      expect(chunks).toEqual([]);
    });

    it('should handle text smaller than chunk size', () => {
      const text = 'Short text';
      const chunks = service.chunkText(text, { maxChunkSize: 1000 });

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(text);
      expect(chunks[0].index).toBe(0);
    });

    it('should include metadata in chunks', () => {
      const text = 'This is a test sentence. Another sentence here.';
      const chunks = service.chunkText(text, { maxChunkSize: 1000 });

      expect(chunks[0].metadata).toBeDefined();
      expect(chunks[0].metadata?.wordCount).toBeGreaterThan(0);
      expect(chunks[0].metadata?.sentenceCount).toBeGreaterThan(0);
    });

    it('should apply overlap between chunks', () => {
      const text = 'a'.repeat(1800); // Reduced from 2500
      const chunks = service.chunkText(text, {
        maxChunkSize: 1000,
        overlap: 200,
        preserveParagraphs: false,
        preserveSentences: false,
      });

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      // Verify overlap exists (chunks should have some common content)
      if (chunks.length >= 2) {
        const chunk1End = chunks[0].endPosition;
        const chunk2Start = chunks[1].startPosition;
        expect(chunk1End).toBeGreaterThan(chunk2Start);
      }
    });
  });

  describe('chunkMarkdown', () => {
    it('should chunk markdown preserving headers', () => {
      const markdown = `# Title

Some intro text.

## Section 1

Content for section 1.

## Section 2

Content for section 2.`;

      const chunks = service.chunkMarkdown(markdown, {
        maxChunkSize: 100,
      });

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((chunk) => {
        expect(chunk.metadata?.type).toBe('markdown-section');
      });
    });

    it('should split large markdown sections', () => {
      const markdown = `# Title

${'a'.repeat(1200)} 

## Next Section

More content`;

      const chunks = service.chunkMarkdown(markdown, {
        maxChunkSize: 500,
      });

      expect(chunks.length).toBeGreaterThan(2);
    });

    it('should handle markdown without headers', () => {
      const markdown = 'Just plain text without any headers.';
      const chunks = service.chunkMarkdown(markdown);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(markdown);
    });
  });

  describe('metadata generation', () => {
    it('should count words correctly', () => {
      const text = 'One two three four five words';
      const chunks = service.chunkText(text);

      expect(chunks[0].metadata?.wordCount).toBe(6);
    });

    it('should count sentences correctly', () => {
      const text = 'First sentence. Second sentence! Third sentence?';
      const chunks = service.chunkText(text);

      expect(chunks[0].metadata?.sentenceCount).toBe(3);
    });

    it('should include start and end positions', () => {
      const text = 'a'.repeat(1500); // Reduced from 2000
      const chunks = service.chunkText(text, {
        maxChunkSize: 500,
        overlap: 0,
      });

      expect(chunks[0].startPosition).toBe(0);
      expect(chunks[0].endPosition).toBeGreaterThan(0);

      if (chunks.length > 1) {
        expect(chunks[1].startPosition).toBeGreaterThanOrEqual(
          chunks[0].endPosition,
        );
      }
    });
  });

  describe('edge cases', () => {
    it('should handle text with only whitespace', () => {
      const text = '   \n\n   \t\t   ';
      const chunks = service.chunkText(text);

      expect(chunks).toEqual([]);
    });

    it('should handle very long words', () => {
      const text = 'a'.repeat(1200); // Reduced from 1500
      const chunks = service.chunkText(text, {
        maxChunkSize: 1000,
        preserveSentences: false,
      });

      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should handle mixed line endings', () => {
      const text = 'Line 1\r\nLine 2\nLine 3\rLine 4';
      const chunks = service.chunkText(text);

      expect(chunks[0].content).not.toContain('\r');
    });

    it('should handle multiple consecutive spaces', () => {
      const text = 'Word1    Word2     Word3';
      const chunks = service.chunkText(text);

      expect(chunks[0].content).not.toMatch(/  +/);
    });
  });
});
