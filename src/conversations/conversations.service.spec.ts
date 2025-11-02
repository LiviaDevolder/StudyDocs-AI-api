/* eslint-disable @typescript-eslint/unbound-method */
import { ConversationsService } from './conversations.service';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationInput } from './dto/create-conversation.dto';
import { UpdateConversationInput } from './dto/update-conversation.dto';
import { NotFoundException } from '@nestjs/common';
import { createMockRepository } from '../../test';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationRepository: jest.Mocked<Repository<Conversation>>;

  beforeEach(() => {
    conversationRepository = createMockRepository<Conversation>();
    service = new ConversationsService(conversationRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new conversation', async () => {
      // Arrange
      const createInput: CreateConversationInput = {
        projectId: 'project-123',
        title: 'New Chat Session',
      };
      const savedConversation = {
        id: 'conv-1',
        ...createInput,
      } as Conversation;

      conversationRepository.create.mockReturnValue(savedConversation);
      conversationRepository.save.mockResolvedValue(savedConversation);

      // Act
      const result = await service.create(createInput);

      // Assert
      expect(result).toEqual(savedConversation);
      expect(conversationRepository.create).toHaveBeenCalledWith(createInput);
      expect(conversationRepository.save).toHaveBeenCalledWith(
        savedConversation,
      );
    });
  });

  describe('findAll', () => {
    it('should return all conversations with relations', async () => {
      // Arrange
      const conversations = [
        { id: '1', title: 'Chat 1' },
        { id: '2', title: 'Chat 2' },
      ] as Conversation[];
      conversationRepository.find.mockResolvedValue(conversations);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(conversations);
      expect(result).toHaveLength(2);
      expect(conversationRepository.find).toHaveBeenCalledWith({
        relations: ['project', 'messages'],
      });
    });

    it('should return empty array when no conversations exist', async () => {
      // Arrange
      conversationRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a conversation by id', async () => {
      // Arrange
      const conversation = {
        id: 'conv-1',
        title: 'Test Chat',
        projectId: 'project-1',
      } as Conversation;
      conversationRepository.findOne.mockResolvedValue(conversation);

      // Act
      const result = await service.findOne('conv-1');

      // Assert
      expect(result).toEqual(conversation);
      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        relations: ['project', 'messages'],
      });
    });

    it('should throw NotFoundException when conversation not found', async () => {
      // Arrange
      conversationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Conversation with ID nonexistent not found',
      );
    });
  });

  describe('findByProject', () => {
    it('should return conversations for a project ordered by date', async () => {
      // Arrange
      const projectId = 'project-123';
      const conversations = [
        { id: '1', projectId, title: 'Recent chat' },
        { id: '2', projectId, title: 'Older chat' },
      ] as Conversation[];
      conversationRepository.find.mockResolvedValue(conversations);

      // Act
      const result = await service.findByProject(projectId);

      // Assert
      expect(result).toEqual(conversations);
      expect(result).toHaveLength(2);
      expect(conversationRepository.find).toHaveBeenCalledWith({
        where: { projectId },
        relations: ['project', 'messages'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when project has no conversations', async () => {
      // Arrange
      conversationRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findByProject('empty-project');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a conversation', async () => {
      // Arrange
      const updateInput: UpdateConversationInput = {
        title: 'Updated Chat Title',
      };
      const existingConversation = {
        id: '1',
        title: 'Old Title',
      } as Conversation;
      const updatedConversation = {
        ...existingConversation,
        ...updateInput,
      } as Conversation;

      jest.spyOn(service, 'findOne').mockResolvedValue(existingConversation);
      conversationRepository.save.mockResolvedValue(updatedConversation);

      // Act
      const result = await service.update('1', updateInput);

      // Assert
      expect(result.title).toBe('Updated Chat Title');
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(conversationRepository.save).toHaveBeenCalledWith(
        updatedConversation,
      );
    });

    it('should throw NotFoundException when updating non-existent conversation', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(
        service.update('nonexistent', { title: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a conversation', async () => {
      // Arrange
      const conversation = { id: '1', title: 'Test' } as Conversation;
      jest.spyOn(service, 'findOne').mockResolvedValue(conversation);
      conversationRepository.remove.mockResolvedValue(conversation);

      // Act
      const result = await service.remove('1');

      // Assert
      expect(result).toBe(true);
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(conversationRepository.remove).toHaveBeenCalledWith(conversation);
    });

    it('should throw NotFoundException when removing non-existent conversation', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
