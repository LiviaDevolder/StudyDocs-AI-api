import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from './embeddings.service';

jest.mock('axios');
const axios = require('axios');

describe('EmbeddingsService', () => {
  let service: EmbeddingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                'vertexai.projectId': 'test-project',
                'vertexai.location': 'us-central1',
                'vertexai.apiKey': 'test-api-key-123',
                'vertexai.embeddingModel': 'text-embedding-004',
                'vertexai.embeddingDimension': 768,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmbeddingsService>(EmbeddingsService);
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

      const result = await service.generateEmbedding('Test text');

      expect(result.embedding).toEqual(mockEmbedding);
      expect(result.text).toBe('Test text');
      expect(result.dimension).toBe(768);
    });

    it('should throw error for empty text', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow('Text cannot be empty');
    });
  });

  describe('getEmbeddingDimension', () => {
    it('should return configured dimension', () => {
      expect(service.getEmbeddingDimension()).toBe(768);
    });
  });

  describe('getModelName', () => {
    it('should return configured model name', () => {
      expect(service.getModelName()).toBe('text-embedding-004');
    });
  });
});
