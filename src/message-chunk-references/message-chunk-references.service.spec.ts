/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MessageChunkReferencesService } from './message-chunk-references.service';
import { MessageChunkReference } from './entities/message-chunk-reference.entity';
import { CreateMessageChunkReferenceDto } from './dto/create-message-chunk-reference.dto';
import { UpdateMessageChunkReferenceDto } from './dto/update-message-chunk-reference.dto';
import { createMockRepository } from '../../test';

describe('MessageChunkReferencesService', () => {
  let service: MessageChunkReferencesService;
  let repository: jest.Mocked<Repository<MessageChunkReference>>;

  beforeEach(() => {
    repository = createMockRepository<MessageChunkReference>();
    service = new MessageChunkReferencesService(repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new message chunk reference', async () => {
      // Arrange
      const createDto: CreateMessageChunkReferenceDto = {
        messageId: '123e4567-e89b-12d3-a456-426614174001',
        chunkId: '123e4567-e89b-12d3-a456-426614174002',
        relevanceScore: 0.85,
        order: 1,
      };
      const savedReference = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...createDto,
        createdAt: new Date(),
      } as MessageChunkReference;

      repository.create.mockReturnValue(savedReference);
      repository.save.mockResolvedValue(savedReference);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toEqual(savedReference);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(savedReference);
    });
  });

  describe('createMany', () => {
    it('should create multiple message chunk references', async () => {
      // Arrange
      const createDtos: CreateMessageChunkReferenceDto[] = [
        {
          messageId: '123e4567-e89b-12d3-a456-426614174001',
          chunkId: '123e4567-e89b-12d3-a456-426614174002',
          relevanceScore: 0.85,
          order: 1,
        },
        {
          messageId: '123e4567-e89b-12d3-a456-426614174001',
          chunkId: '123e4567-e89b-12d3-a456-426614174003',
          relevanceScore: 0.75,
          order: 2,
        },
      ];

      const savedReferences = createDtos.map((dto, index) => ({
        id: `123e4567-e89b-12d3-a456-42661417400${index}`,
        ...dto,
        createdAt: new Date(),
      })) as MessageChunkReference[];

      repository.create.mockReturnValue(savedReferences as any);
      repository.save.mockResolvedValue(savedReferences as any);

      // Act
      const result = await service.createMany(createDtos);

      // Assert
      expect(result).toEqual(savedReferences);
      expect(result).toHaveLength(2);
      expect(repository.create).toHaveBeenCalledWith(createDtos);
      expect(repository.save).toHaveBeenCalledWith(savedReferences);
    });
  });

  describe('findAll', () => {
    it('should return an array of message chunk references', async () => {
      // Arrange
      const references = [
        {
          id: '1',
          messageId: 'msg-1',
          chunkId: 'chunk-1',
          relevanceScore: 0.9,
        },
        {
          id: '2',
          messageId: 'msg-1',
          chunkId: 'chunk-2',
          relevanceScore: 0.8,
        },
      ] as MessageChunkReference[];

      repository.find.mockResolvedValue(references);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(references);
      expect(result).toHaveLength(2);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['message', 'chunk', 'chunk.document'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no references exist', async () => {
      // Arrange
      repository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a single message chunk reference', async () => {
      // Arrange
      const reference = {
        id: 'ref-1',
        messageId: 'msg-1',
        chunkId: 'chunk-1',
        relevanceScore: 0.85,
      } as MessageChunkReference;

      repository.findOne.mockResolvedValue(reference);

      // Act
      const result = await service.findOne('ref-1');

      // Assert
      expect(result).toEqual(reference);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'ref-1' },
        relations: ['message', 'chunk', 'chunk.document'],
      });
    });

    it('should throw NotFoundException when reference not found', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'MessageChunkReference with ID nonexistent not found',
      );
    });
  });

  describe('findByMessageId', () => {
    it('should return references for a specific message', async () => {
      // Arrange
      const messageId = 'msg-123';
      const references = [
        {
          id: '1',
          messageId,
          chunkId: 'chunk-1',
          relevanceScore: 0.9,
          order: 1,
        },
        {
          id: '2',
          messageId,
          chunkId: 'chunk-2',
          relevanceScore: 0.8,
          order: 2,
        },
      ] as MessageChunkReference[];

      repository.find.mockResolvedValue(references);

      // Act
      const result = await service.findByMessageId(messageId);

      // Assert
      expect(result).toEqual(references);
      expect(result).toHaveLength(2);
      expect(repository.find).toHaveBeenCalledWith({
        where: { messageId },
        relations: ['chunk', 'chunk.document'],
        order: { order: 'ASC', relevanceScore: 'DESC' },
      });
    });

    it('should return empty array when message has no chunk references', async () => {
      // Arrange
      repository.find.mockResolvedValue([]);

      // Act
      const result = await service.findByMessageId('msg-empty');

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findByChunkId', () => {
    it('should return references for a specific chunk', async () => {
      // Arrange
      const chunkId = 'chunk-123';
      const references = [
        {
          id: '1',
          messageId: 'msg-1',
          chunkId,
          relevanceScore: 0.9,
        },
        {
          id: '2',
          messageId: 'msg-2',
          chunkId,
          relevanceScore: 0.85,
        },
      ] as MessageChunkReference[];

      repository.find.mockResolvedValue(references);

      // Act
      const result = await service.findByChunkId(chunkId);

      // Assert
      expect(result).toEqual(references);
      expect(result).toHaveLength(2);
      expect(repository.find).toHaveBeenCalledWith({
        where: { chunkId },
        relations: ['message'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when chunk has no references', async () => {
      // Arrange
      repository.find.mockResolvedValue([]);

      // Act
      const result = await service.findByChunkId('chunk-unused');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a message chunk reference', async () => {
      // Arrange
      const updateDto: UpdateMessageChunkReferenceDto = {
        relevanceScore: 0.95,
        order: 2,
      };
      const existingReference = {
        id: 'ref-1',
        messageId: 'msg-1',
        chunkId: 'chunk-1',
        relevanceScore: 0.85,
        order: 1,
      } as MessageChunkReference;
      const updatedReference = {
        ...existingReference,
        ...updateDto,
      } as MessageChunkReference;

      jest.spyOn(service, 'findOne').mockResolvedValue(existingReference);
      repository.save.mockResolvedValue(updatedReference);

      // Act
      const result = await service.update('ref-1', updateDto);

      // Assert
      expect(result.relevanceScore).toBe(0.95);
      expect(result.order).toBe(2);
      expect(service.findOne).toHaveBeenCalledWith('ref-1');
      expect(repository.save).toHaveBeenCalledWith(updatedReference);
    });

    it('should throw NotFoundException when updating non-existent reference', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(
        service.update('nonexistent', { relevanceScore: 0.95 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a message chunk reference', async () => {
      // Arrange
      const reference = {
        id: 'ref-1',
        messageId: 'msg-1',
        chunkId: 'chunk-1',
      } as MessageChunkReference;

      jest.spyOn(service, 'findOne').mockResolvedValue(reference);
      repository.remove.mockResolvedValue(reference);

      // Act
      const result = await service.remove('ref-1');

      // Assert
      expect(result).toEqual(reference);
      expect(service.findOne).toHaveBeenCalledWith('ref-1');
      expect(repository.remove).toHaveBeenCalledWith(reference);
    });

    it('should throw NotFoundException when removing non-existent reference', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeByMessageId', () => {
    it('should remove all references for a message', async () => {
      // Arrange
      const messageId = 'msg-123';
      repository.delete.mockResolvedValue({ affected: 3, raw: {} });

      // Act
      await service.removeByMessageId(messageId);

      // Assert
      expect(repository.delete).toHaveBeenCalledWith({ messageId });
    });

    it('should handle when no references exist for the message', async () => {
      // Arrange
      const messageId = 'msg-empty';
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      // Act
      await service.removeByMessageId(messageId);

      // Assert
      expect(repository.delete).toHaveBeenCalledWith({ messageId });
    });
  });
});
