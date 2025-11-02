/* eslint-disable @typescript-eslint/unbound-method */
import { DocumentChunksService } from './document-chunks.service';
import { Repository } from 'typeorm';
import { DocumentChunk } from './entities/document-chunk.entity';
import { CreateDocumentChunkInput } from './dto/create-document-chunk.dto';
import { UpdateDocumentChunkInput } from './dto/update-document-chunk.dto';
import { NotFoundException } from '@nestjs/common';
import { createMockRepository } from '../../test';

describe('DocumentChunksService', () => {
  let service: DocumentChunksService;
  let documentChunkRepository: jest.Mocked<Repository<DocumentChunk>>;

  beforeEach(() => {
    documentChunkRepository = createMockRepository<DocumentChunk>();
    service = new DocumentChunksService(documentChunkRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new document chunk', async () => {
      const createInput: CreateDocumentChunkInput = {
        documentId: 'doc-123',
        content: 'Test content',
      };
      const savedChunk = { id: 'chunk-1', ...createInput } as DocumentChunk;

      documentChunkRepository.create.mockReturnValue(savedChunk);
      documentChunkRepository.save.mockResolvedValue(savedChunk);

      const result = await service.create(createInput);

      expect(result).toEqual(savedChunk);
      expect(documentChunkRepository.create).toHaveBeenCalledWith(createInput);
      expect(documentChunkRepository.save).toHaveBeenCalledWith(savedChunk);
    });
  });

  describe('findAll', () => {
    it('should return all document chunks', async () => {
      const chunks = [
        { id: '1', content: 'chunk 1' },
        { id: '2', content: 'chunk 2' },
      ] as DocumentChunk[];

      documentChunkRepository.find.mockResolvedValue(chunks);

      const result = await service.findAll();

      expect(result).toEqual(chunks);
      expect(result).toHaveLength(2);
      expect(documentChunkRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no chunks exist', async () => {
      documentChunkRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a document chunk by id', async () => {
      const chunk = { id: 'chunk-1', content: 'test' } as DocumentChunk;
      documentChunkRepository.findOne.mockResolvedValue(chunk);

      const result = await service.findOne('chunk-1');

      expect(result).toEqual(chunk);
      expect(documentChunkRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'chunk-1' },
      });
    });

    it('should throw NotFoundException when chunk not found', async () => {
      documentChunkRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'DocumentChunk with ID nonexistent not found',
      );
    });
  });

  describe('findByDocument', () => {
    it('should return chunks for a specific document', async () => {
      const documentId = 'doc-123';
      const chunks = [
        { id: '1', documentId, content: 'chunk 1' },
        { id: '2', documentId, content: 'chunk 2' },
      ] as DocumentChunk[];

      documentChunkRepository.find.mockResolvedValue(chunks);

      const result = await service.findByDocument(documentId);

      expect(result).toEqual(chunks);
      expect(result).toHaveLength(2);
      expect(documentChunkRepository.find).toHaveBeenCalledWith({
        where: { documentId },
      });
    });

    it('should return empty array when document has no chunks', async () => {
      documentChunkRepository.find.mockResolvedValue([]);

      const result = await service.findByDocument('doc-empty');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a document chunk', async () => {
      const updateInput: UpdateDocumentChunkInput = {
        content: 'Updated content',
      };
      const existingChunk = {
        id: '1',
        content: 'Old content',
      } as DocumentChunk;
      const updatedChunk = {
        ...existingChunk,
        ...updateInput,
      } as DocumentChunk;

      jest.spyOn(service, 'findOne').mockResolvedValue(existingChunk);
      documentChunkRepository.save.mockResolvedValue(updatedChunk);

      const result = await service.update('1', updateInput);

      expect(result.content).toBe('Updated content');
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(documentChunkRepository.save).toHaveBeenCalledWith(updatedChunk);
    });

    it('should throw NotFoundException when updating non-existent chunk', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(
        service.update('nonexistent', { content: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a document chunk', async () => {
      const chunk = { id: '1', content: 'test' } as DocumentChunk;
      jest.spyOn(service, 'findOne').mockResolvedValue(chunk);
      documentChunkRepository.remove.mockResolvedValue(chunk);

      const result = await service.remove('1');

      expect(result).toBe(true);
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(documentChunkRepository.remove).toHaveBeenCalledWith(chunk);
    });

    it('should throw NotFoundException when removing non-existent chunk', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
