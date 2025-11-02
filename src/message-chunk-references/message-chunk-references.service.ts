import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMessageChunkReferenceDto } from './dto/create-message-chunk-reference.dto';
import { UpdateMessageChunkReferenceDto } from './dto/update-message-chunk-reference.dto';
import { MessageChunkReference } from './entities/message-chunk-reference.entity';

@Injectable()
export class MessageChunkReferencesService {
  constructor(
    @InjectRepository(MessageChunkReference)
    private readonly messageChunkReferenceRepository: Repository<MessageChunkReference>,
  ) {}

  async create(
    createMessageChunkReferenceDto: CreateMessageChunkReferenceDto,
  ): Promise<MessageChunkReference> {
    const reference = this.messageChunkReferenceRepository.create(
      createMessageChunkReferenceDto,
    );
    return await this.messageChunkReferenceRepository.save(reference);
  }

  async createMany(
    createDtos: CreateMessageChunkReferenceDto[],
  ): Promise<MessageChunkReference[]> {
    const references = this.messageChunkReferenceRepository.create(createDtos);
    return await this.messageChunkReferenceRepository.save(references);
  }

  async findAll(): Promise<MessageChunkReference[]> {
    return await this.messageChunkReferenceRepository.find({
      relations: ['message', 'chunk', 'chunk.document'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MessageChunkReference> {
    const reference = await this.messageChunkReferenceRepository.findOne({
      where: { id },
      relations: ['message', 'chunk', 'chunk.document'],
    });

    if (!reference) {
      throw new NotFoundException(
        `MessageChunkReference with ID ${id} not found`,
      );
    }

    return reference;
  }

  async findByMessageId(messageId: string): Promise<MessageChunkReference[]> {
    return await this.messageChunkReferenceRepository.find({
      where: { messageId },
      relations: ['chunk', 'chunk.document'],
      order: { order: 'ASC', relevanceScore: 'DESC' },
    });
  }

  async findByChunkId(chunkId: string): Promise<MessageChunkReference[]> {
    return await this.messageChunkReferenceRepository.find({
      where: { chunkId },
      relations: ['message'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateMessageChunkReferenceDto: UpdateMessageChunkReferenceDto,
  ): Promise<MessageChunkReference> {
    const reference = await this.findOne(id);
    Object.assign(reference, updateMessageChunkReferenceDto);
    return await this.messageChunkReferenceRepository.save(reference);
  }

  async remove(id: string): Promise<MessageChunkReference> {
    const reference = await this.findOne(id);
    await this.messageChunkReferenceRepository.remove(reference);
    return reference;
  }

  async removeByMessageId(messageId: string): Promise<void> {
    await this.messageChunkReferenceRepository.delete({ messageId });
  }
}
