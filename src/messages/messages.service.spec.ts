/* eslint-disable @typescript-eslint/unbound-method */
import { MessagesService } from './messages.service';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageInput } from './dto/create-message.dto';
import { UpdateMessageInput } from './dto/update-message.dto';
import { NotFoundException } from '@nestjs/common';
import { createMockRepository } from '../../test';

describe('MessagesService', () => {
  let service: MessagesService;
  let messageRepository: jest.Mocked<Repository<Message>>;

  beforeEach(() => {
    messageRepository = createMockRepository<Message>();
    service = new MessagesService(messageRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new message', async () => {
      // Arrange
      const createMessageInput: CreateMessageInput = {
        projectId: 'project-123',
        query: 'What is this document about?',
        response: 'This document is about...',
      };
      const savedMessage = { id: 'msg-1', ...createMessageInput } as Message;
      messageRepository.create.mockReturnValue(savedMessage);
      messageRepository.save.mockResolvedValue(savedMessage);

      // Act
      const result = await service.create(createMessageInput);

      // Assert
      expect(result).toEqual(savedMessage);
      expect(messageRepository.create).toHaveBeenCalledWith(createMessageInput);
      expect(messageRepository.save).toHaveBeenCalledWith(savedMessage);
    });
  });

  describe('findAll', () => {
    it('should return all messages with project relation', async () => {
      // Arrange
      const messages = [
        { id: '1', query: 'Question 1' },
        { id: '2', query: 'Question 2' },
      ] as Message[];
      messageRepository.find.mockResolvedValue(messages);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(messages);
      expect(result).toHaveLength(2);
      expect(messageRepository.find).toHaveBeenCalledWith({
        relations: ['project'],
      });
    });

    it('should return empty array when no messages exist', async () => {
      // Arrange
      messageRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a message by id', async () => {
      // Arrange
      const message = { id: 'msg-1', query: 'Test query' } as Message;
      messageRepository.findOne.mockResolvedValue(message);

      // Act
      const result = await service.findOne('msg-1');

      // Assert
      expect(result).toEqual(message);
      expect(messageRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        relations: ['project'],
      });
    });

    it('should throw NotFoundException when message not found', async () => {
      // Arrange
      messageRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Message with ID nonexistent not found',
      );
    });
  });

  describe('findByProject', () => {
    it('should return messages for a project ordered by date', async () => {
      // Arrange
      const projectId = 'project-123';
      const messages = [
        { id: '1', projectId, query: 'First question' },
        { id: '2', projectId, query: 'Second question' },
      ] as Message[];
      messageRepository.find.mockResolvedValue(messages);

      // Act
      const result = await service.findByProject(projectId);

      // Assert
      expect(result).toEqual(messages);
      expect(result).toHaveLength(2);
      expect(messageRepository.find).toHaveBeenCalledWith({
        where: { projectId },
        relations: ['project'],
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array when project has no messages', async () => {
      // Arrange
      messageRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findByProject('empty-project');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a message', async () => {
      // Arrange
      const updateInput: UpdateMessageInput = { query: 'Updated question' };
      const existingMessage = {
        id: '1',
        query: 'Old question',
      } as Message;
      const updatedMessage = {
        ...existingMessage,
        ...updateInput,
      } as Message;
      jest.spyOn(service, 'findOne').mockResolvedValue(existingMessage);
      messageRepository.save.mockResolvedValue(updatedMessage);

      // Act
      const result = await service.update('1', updateInput);

      // Assert
      expect(result.query).toBe('Updated question');
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(messageRepository.save).toHaveBeenCalledWith(updatedMessage);
    });

    it('should throw NotFoundException when updating non-existent message', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(
        service.update('nonexistent', { query: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a message', async () => {
      // Arrange
      const message = { id: '1', query: 'Test' } as Message;
      jest.spyOn(service, 'findOne').mockResolvedValue(message);
      messageRepository.remove.mockResolvedValue(message);

      // Act
      const result = await service.remove('1');

      // Assert
      expect(result).toBe(true);
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(messageRepository.remove).toHaveBeenCalledWith(message);
    });

    it('should throw NotFoundException when removing non-existent message', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
