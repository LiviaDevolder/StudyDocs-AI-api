import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document, DocumentStatus } from './entities/document.entity';
import { GcsService } from '../common/services/gcs.service';
import { BadRequestException } from '@nestjs/common';

describe('DocumentsService - Upload', () => {
  let service: DocumentsService;
  let mockGcsService: Partial<GcsService>;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    mockGcsService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockRepository,
        },
        {
          provide: GcsService,
          useValue: mockGcsService,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('uploadDocument', () => {
    it('should upload a PDF file successfully', async () => {
      const projectId = 'test-project-id';
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const mockUploadedFileInfo = {
        fileName: 'test_123_uuid.pdf',
        gcsPath: 'projects/test-project-id/test_123_uuid.pdf',
        publicUrl: 'https://storage.googleapis.com/bucket/projects/test-project-id/test_123_uuid.pdf',
        size: 1024,
        mimeType: 'application/pdf',
      };

      const mockDocument = {
        id: 'doc-id',
        projectId,
        name: mockFile.originalname,
        gcsPath: mockUploadedFileInfo.gcsPath,
        type: mockUploadedFileInfo.mimeType,
        fileSize: mockUploadedFileInfo.size,
        status: DocumentStatus.PENDING,
      };

      (mockGcsService.uploadFile as jest.Mock).mockResolvedValue(mockUploadedFileInfo);
      mockRepository.create.mockReturnValue(mockDocument);
      mockRepository.save.mockResolvedValue(mockDocument);

      const result = await service.uploadDocument(projectId, mockFile);

      expect(mockGcsService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        `projects/${projectId}`,
      );
      expect(mockRepository.create).toHaveBeenCalledWith({
        projectId,
        name: mockFile.originalname,
        gcsPath: mockUploadedFileInfo.gcsPath,
        type: mockUploadedFileInfo.mimeType,
        fileSize: mockUploadedFileInfo.size,
        status: DocumentStatus.PENDING,
      });
      expect(result).toEqual(mockDocument);
    });

    it('should throw error if no file provided', async () => {
      await expect(
        service.uploadDocument('project-id', null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for unsupported file type', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.exe',
        encoding: '7bit',
        mimetype: 'application/x-msdownload',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(
        service.uploadDocument('project-id', mockFile),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for file too large', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'large.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 51 * 1024 * 1024, // 51MB
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(
        service.uploadDocument('project-id', mockFile),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept DOCX files', async () => {
      const projectId = 'test-project-id';
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.docx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const mockUploadedFileInfo = {
        fileName: 'test_123_uuid.docx',
        gcsPath: 'projects/test-project-id/test_123_uuid.docx',
        publicUrl: 'https://storage.googleapis.com/bucket/projects/test-project-id/test_123_uuid.docx',
        size: 1024,
        mimeType: mockFile.mimetype,
      };

      const mockDocument = {
        id: 'doc-id',
        projectId,
        name: mockFile.originalname,
        gcsPath: mockUploadedFileInfo.gcsPath,
        type: mockUploadedFileInfo.mimeType,
        fileSize: mockUploadedFileInfo.size,
        status: DocumentStatus.PENDING,
      };

      (mockGcsService.uploadFile as jest.Mock).mockResolvedValue(mockUploadedFileInfo);
      mockRepository.create.mockReturnValue(mockDocument);
      mockRepository.save.mockResolvedValue(mockDocument);

      const result = await service.uploadDocument(projectId, mockFile);

      expect(result.type).toEqual(mockFile.mimetype);
    });

    it('should accept image files (JPEG)', async () => {
      const projectId = 'test-project-id';
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2048,
        buffer: Buffer.from('fake-image-data'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const mockUploadedFileInfo = {
        fileName: 'image_123_uuid.jpg',
        gcsPath: 'projects/test-project-id/image_123_uuid.jpg',
        publicUrl: 'https://storage.googleapis.com/bucket/projects/test-project-id/image_123_uuid.jpg',
        size: 2048,
        mimeType: mockFile.mimetype,
      };

      const mockDocument = {
        id: 'doc-id',
        projectId,
        name: mockFile.originalname,
        gcsPath: mockUploadedFileInfo.gcsPath,
        type: mockUploadedFileInfo.mimeType,
        fileSize: mockUploadedFileInfo.size,
        status: DocumentStatus.PENDING,
      };

      (mockGcsService.uploadFile as jest.Mock).mockResolvedValue(mockUploadedFileInfo);
      mockRepository.create.mockReturnValue(mockDocument);
      mockRepository.save.mockResolvedValue(mockDocument);

      const result = await service.uploadDocument(projectId, mockFile);

      expect(result.type).toEqual('image/jpeg');
    });

    it('should accept PNG images', async () => {
      const projectId = 'test-project-id';
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'screenshot.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 3072,
        buffer: Buffer.from('fake-png-data'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const mockUploadedFileInfo = {
        fileName: 'screenshot_123_uuid.png',
        gcsPath: 'projects/test-project-id/screenshot_123_uuid.png',
        publicUrl: 'https://storage.googleapis.com/bucket/projects/test-project-id/screenshot_123_uuid.png',
        size: 3072,
        mimeType: mockFile.mimetype,
      };

      const mockDocument = {
        id: 'doc-id',
        projectId,
        name: mockFile.originalname,
        gcsPath: mockUploadedFileInfo.gcsPath,
        type: mockUploadedFileInfo.mimeType,
        fileSize: mockUploadedFileInfo.size,
        status: DocumentStatus.PENDING,
      };

      (mockGcsService.uploadFile as jest.Mock).mockResolvedValue(mockUploadedFileInfo);
      mockRepository.create.mockReturnValue(mockDocument);
      mockRepository.save.mockResolvedValue(mockDocument);

      const result = await service.uploadDocument(projectId, mockFile);

      expect(result.type).toEqual('image/png');
    });
  });
});
