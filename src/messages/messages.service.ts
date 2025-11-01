import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageInput } from './dto/create-message.dto';
import { UpdateMessageInput } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async create(createMessageInput: CreateMessageInput): Promise<Message> {
    const message = this.messageRepository.create(createMessageInput);
    return await this.messageRepository.save(message);
  }

  async findAll(): Promise<Message[]> {
    return await this.messageRepository.find({
      relations: ['project'],
    });
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async findByProject(projectId: string): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { projectId },
      relations: ['project'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    id: string,
    updateMessageInput: UpdateMessageInput,
  ): Promise<Message> {
    const message = await this.findOne(id);
    Object.assign(message, updateMessageInput);
    return await this.messageRepository.save(message);
  }

  async remove(id: string): Promise<boolean> {
    const message = await this.findOne(id);
    await this.messageRepository.remove(message);
    return true;
  }
}
