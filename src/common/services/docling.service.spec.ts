import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DoclingService, OutputFormat } from './docling.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DoclingService', () => {
  let service: DoclingService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoclingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'DOCLING_SERVICE_URL') {
                return 'http://localhost:8080';
              }
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DoclingService>(DoclingService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractText', () => {
    it('should extract text from a PDF file', async () => {
      const mockResponse = {
        data: 'Extracted text content',
        status: 200,
        statusText: 'OK',
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const buffer = Buffer.from('fake pdf content');
      const result = await service.extractText(
        buffer,
        'test.pdf',
        OutputFormat.TEXT,
      );

      expect(result).toEqual({
        content: 'Extracted text content',
        format: OutputFormat.TEXT,
        metadata: {},
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/extract',
        expect.any(Object),
        expect.objectContaining({
          params: { output: OutputFormat.TEXT },
          timeout: 120000,
        }),
      );
    });

    it('should extract text in markdown format', async () => {
      const mockMarkdown = '# Title\n\nSome content';
      mockedAxios.post.mockResolvedValue({
        data: mockMarkdown,
        status: 200,
      });

      const buffer = Buffer.from('fake content');
      const result = await service.extractText(
        buffer,
        'document.docx',
        OutputFormat.MARKDOWN,
      );

      expect(result.content).toBe(mockMarkdown);
      expect(result.format).toBe(OutputFormat.MARKDOWN);
    });

    it('should handle JSON response', async () => {
      const mockJsonData = {
        pages: [{ content: 'Page 1' }, { content: 'Page 2' }],
        language: 'en',
      };

      mockedAxios.post.mockResolvedValue({
        data: mockJsonData,
        status: 200,
      });

      const buffer = Buffer.from('fake content');
      const result = await service.extractText(
        buffer,
        'document.pdf',
        OutputFormat.JSON,
      );

      expect(result.content).toBe(JSON.stringify(mockJsonData));
      expect(result.format).toBe(OutputFormat.JSON);
      expect(result.metadata).toEqual({
        pages: 2,
        language: 'en',
        documentType: undefined,
      });
    });

    it('should throw error when service is unavailable', async () => {
      mockedAxios.post.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      const buffer = Buffer.from('fake content');

      await expect(
        service.extractText(buffer, 'test.pdf'),
      ).rejects.toThrow('Docling service is not available');
    });

    it('should throw error on service error response', async () => {
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 500,
          statusText: 'Internal Server Error',
        },
        isAxiosError: true,
      });

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

      const buffer = Buffer.from('fake content');

      await expect(
        service.extractText(buffer, 'test.pdf'),
      ).rejects.toThrow('Docling service error');
    });
  });

  describe('extractTextBatch', () => {
    it('should extract text from multiple files', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: 'Text 1', status: 200 })
        .mockResolvedValueOnce({ data: 'Text 2', status: 200 })
        .mockResolvedValueOnce({ data: 'Text 3', status: 200 });

      const files = [
        { buffer: Buffer.from('file1'), fileName: 'doc1.pdf' },
        { buffer: Buffer.from('file2'), fileName: 'doc2.pdf' },
        { buffer: Buffer.from('file3'), fileName: 'doc3.pdf' },
      ];

      const results = await service.extractTextBatch(files);

      expect(results).toHaveLength(3);
      expect(results[0].content).toBe('Text 1');
      expect(results[1].content).toBe('Text 2');
      expect(results[2].content).toBe('Text 3');
    });

    it('should handle partial failures in batch', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: 'Text 1', status: 200 })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ data: 'Text 3', status: 200 });

      const files = [
        { buffer: Buffer.from('file1'), fileName: 'doc1.pdf' },
        { buffer: Buffer.from('file2'), fileName: 'doc2.pdf' },
        { buffer: Buffer.from('file3'), fileName: 'doc3.pdf' },
      ];

      const results = await service.extractTextBatch(files);

      expect(results).toHaveLength(2);
      expect(results[0].content).toBe('Text 1');
      expect(results[1].content).toBe('Text 3');
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200 });

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8080/health',
        { timeout: 5000 },
      );
    });

    it('should return false when service is unhealthy', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection failed'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});
