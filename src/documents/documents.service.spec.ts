/* eslint-disable @typescript-eslint/unbound-method */
import { DocumentsService } from './documents.service';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentInput } from './dto/create-document.dto';
import { UpdateDocumentInput } from './dto/update-document.dto';
import { NotFoundException } from '@nestjs/common';
import { createMockRepository } from '../../test';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentRepository: jest.Mocked<Repository<Document>>;

  beforeEach(() => {
    documentRepository = createMockRepository<Document>();
    service = new DocumentsService(documentRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new document', async () => {
      const createInput: CreateDocumentInput = {
        name: 'Test Document',
        projectId: 'project-123',
        gcsPath: 'gs://bucket/file.pdf',
        type: 'pdf',
      };
      const savedDoc = { id: 'doc-1', ...createInput } as Document;

      documentRepository.create.mockReturnValue(savedDoc);
      documentRepository.save.mockResolvedValue(savedDoc);

      const result = await service.create(createInput);

      expect(result).toEqual(savedDoc);
      expect(documentRepository.create).toHaveBeenCalledWith(createInput);
      expect(documentRepository.save).toHaveBeenCalledWith(savedDoc);
    });
  });

  describe('findAll', () => {
    it('should return all documents with relations', async () => {
      const documents = [
        { id: '1', name: 'Doc 1' },
        { id: '2', name: 'Doc 2' },
      ] as Document[];

      documentRepository.find.mockResolvedValue(documents);

      const result = await service.findAll();

      expect(result).toEqual(documents);
      expect(result).toHaveLength(2);
      expect(documentRepository.find).toHaveBeenCalledWith({
        relations: ['project'],
      });
    });

    it('should return empty array when no documents exist', async () => {
      documentRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a document by id with relations', async () => {
      const document = {
        id: 'doc-1',
        name: 'Test Doc',
      } as Document;
      documentRepository.findOne.mockResolvedValue(document);

      const result = await service.findOne('doc-1');

      expect(result).toEqual(document);
      expect(documentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        relations: ['project', 'chunks'],
      });
    });

    it('should throw NotFoundException when document not found', async () => {
      documentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Document with ID nonexistent not found',
      );
    });
  });

  describe('findByProject', () => {
    it('should return documents for a specific project', async () => {
      const projectId = 'project-123';
      const documents = [
        { id: '1', projectId, name: 'Doc 1' },
        { id: '2', projectId, name: 'Doc 2' },
      ] as Document[];

      documentRepository.find.mockResolvedValue(documents);

      const result = await service.findByProject(projectId);

      expect(result).toEqual(documents);
      expect(result).toHaveLength(2);
      expect(documentRepository.find).toHaveBeenCalledWith({
        where: { projectId },
        relations: ['project', 'chunks'],
      });
    });

    it('should return empty array when project has no documents', async () => {
      documentRepository.find.mockResolvedValue([]);

      const result = await service.findByProject('empty-project');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a document', async () => {
      const updateInput: UpdateDocumentInput = {
        name: 'Updated Document',
      };
      const existingDoc = { id: '1', name: 'Old Name' } as Document;
      const updatedDoc = { ...existingDoc, ...updateInput } as Document;

      jest.spyOn(service, 'findOne').mockResolvedValue(existingDoc);
      documentRepository.save.mockResolvedValue(updatedDoc);

      const result = await service.update('1', updateInput);

      expect(result.name).toBe('Updated Document');
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(documentRepository.save).toHaveBeenCalledWith(updatedDoc);
    });

    it('should throw NotFoundException when updating non-existent document', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(
        service.update('nonexistent', { name: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a document', async () => {
      const document = { id: '1', name: 'Test' } as Document;
      jest.spyOn(service, 'findOne').mockResolvedValue(document);
      documentRepository.remove.mockResolvedValue(document);

      const result = await service.remove('1');

      expect(result).toBe(true);
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(documentRepository.remove).toHaveBeenCalledWith(document);
    });

    it('should throw NotFoundException when removing non-existent document', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
