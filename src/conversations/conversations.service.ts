import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationInput } from './dto/create-conversation.dto';
import { UpdateConversationInput } from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  async create(
    createConversationInput: CreateConversationInput,
  ): Promise<Conversation> {
    const conversation = this.conversationRepository.create(
      createConversationInput,
    );
    return await this.conversationRepository.save(conversation);
  }

  async findAll(): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      relations: ['project', 'messages'],
    });
  }

  async findOne(id: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['project', 'messages'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async findByProject(projectId: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { projectId },
      relations: ['project', 'messages'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateConversationInput: UpdateConversationInput,
  ): Promise<Conversation> {
    const conversation = await this.findOne(id);
    Object.assign(conversation, updateConversationInput);
    return await this.conversationRepository.save(conversation);
  }

  async remove(id: string): Promise<boolean> {
    const conversation = await this.findOne(id);
    await this.conversationRepository.remove(conversation);
    return true;
  }
}
