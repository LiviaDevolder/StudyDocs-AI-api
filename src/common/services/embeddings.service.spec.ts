import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from './embeddings.service';

jest.mock('axios');
const axios = require('axios');

describe('EmbeddingsService', () => {
  let service: EmbeddingsService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                'vertexai.projectId': 'test-project',
                'vertexai.location': 'us-central1',
                'vertexai.apiKey': 'test-api-key-123',
                'vertexai.embeddingModel': 'text-embedding-004',
                'vertexai.embeddingDimension': 768,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmbeddingsService>(EmbeddingsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for text', async () => {
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random());
      
      axios.post = jest.fn().mockResolvedValue({
        data: {
          predictions: [{
            embeddings: {
              values: mockEmbedding,
            },
          }],
        },
      });

      const result = await service.generateEmbedding('Test text for embedding');

      expect(result).toEqual({
        embedding: mockEmbedding,
        text: 'Test text for embedding',
        dimension: 768,
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('aiplatform.googleapis.com'),
        expect.objectContaining({
          instances: [{ content: 'Test text for embedding' }],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-goog-api-key': 'test-api-key-123',
          }),
        }),
      );
    });

    it('should truncate text longer than 20k characters', async () => {
      const longText = 'a'.repeat(25000);
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random());
      
      axios.post = jest.fn().mockResolvedValue({
        data: {
          predictions: [{
            embeddings: {
              values: mockEmbedding,
            },
          }],
        },
      });

      const result = await service.generateEmbedding(longText);

      expect(result.text.length).toBe(20000);
      expect(result.embedding).toEqual(mockEmbedding);
    });

    it('should throw error for empty text', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow(
        'Text cannot be empty',
      );
    });

    it('should throw error when no embedding in response', async () => {
      axios.post = jest.fn().mockResolvedValue({
        data: {
          predictions: [{}],
        },
      });

      await expect(service.generateEmbedding('Test text')).rejects.toThrow(
        'Embedding generation failed',
      );
    });
  });

  describe('generateEmbeddingsBatch', () => {
    it('should generate embeddings for multiple texts', async () => {
      const texts = ['Text 1', 'Text 2', 'Text 3'];
      const mockEmbedding1 = new Array(768).fill(0).map(() => Math.random());
      const mockEmbedding2 = new Array(768).fill(0).map(() => Math.random());
      const mockEmbedding3 = new Array(768).fill(0).map(() => Math.random());

      axios.post = jest.fn()
        .mockResolvedValueOnce({
          data: { predictions: [{ embeddings: { values: mockEmbedding1 } }] },
        })
        .mockResolvedValueOnce({
          data: { predictions: [{ embeddings: { values: mockEmbedding2 } }] },
        })
        .mockResolvedValueOnce({
          data: { predictions: [{ embeddings: { values: mockEmbedding3 } }] },
        });

      const result = await service.generateEmbeddingsBatch(texts);

      expect(result.embeddings).toHaveLength(3);
      expect(result.embeddings[0].text).toBe('Text 1');
      expect(result.embeddings[1].text).toBe('Text 2');
      expect(result.embeddings[2].text).toBe('Text 3');
    });

    it('should handle partial failures in batch', async () => {
      const texts = ['Text 1', 'Text 2', 'Text 3'];
      const mockEmbedding1 = new Array(768).fill(0).map(() => Math.random());
      const mockEmbedding3 = new Array(768).fill(0).map(() => Math.random());

      axios.post = jest.fn()
        .mockResolvedValueOnce({
          data: { predictions: [{ embeddings: { values: mockEmbedding1 } }] },
        })
        .mockRejectedValueOnce(new Error('Failed to generate'))
        .mockResolvedValueOnce({
          data: { predictions: [{ embeddings: { values: mockEmbedding3 } }] },
        });

      const result = await service.generateEmbeddingsBatch(texts);

      expect(result.embeddings).toHaveLength(2);
      expect(result.embeddings[0].text).toBe('Text 1');
      expect(result.embeddings[1].text).toBe('Text 3');
    });

    it('should return empty array for empty input', async () => {
      const result = await service.generateEmbeddingsBatch([]);

      expect(result.embeddings).toEqual([]);
    });

    it('should process in batches', async () => {
      const texts = new Array(12).fill(0).map((_, i) => `Text ${i}`);
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random());

      axios.post = jest.fn().mockResolvedValue({
        data: { predictions: [{ embeddings: { values: mockEmbedding } }] },
      });

      const result = await service.generateEmbeddingsBatch(texts, 5);

      expect(result.embeddings).toHaveLength(12);
      expect(axios.post).toHaveBeenCalledTimes(12);
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0, 0];

      const similarity = service.cosineSimilarity(embedding1, embedding2);

      expect(similarity).toBe(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];

      const similarity = service.cosineSimilarity(embedding1, embedding2);

      expect(similarity).toBeCloseTo(0);
    });

    it('should throw error for different dimensions', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0];

      expect(() => service.cosineSimilarity(embedding1, embedding2)).toThrow(
        'Embeddings must have the same dimension',
      );
    });

    it('should handle zero vectors', () => {
      const embedding1 = [0, 0, 0];
      const embedding2 = [1, 2, 3];

      const similarity = service.cosineSimilarity(embedding1, embedding2);

      expect(similarity).toBe(0);
    });
  });

  describe('getEmbeddingDimension', () => {
    it('should return configured dimension', () => {
      const dimension = service.getEmbeddingDimension();

      expect(dimension).toBe(768);
    });
  });

  describe('getModelName', () => {
    it('should return configured model name', () => {
      const model = service.getModelName();

      expect(model).toBe('text-embedding-004');
    });
  });
});
