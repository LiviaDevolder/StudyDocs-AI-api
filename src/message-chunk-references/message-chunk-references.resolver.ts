import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { MessageChunkReferencesService } from './message-chunk-references.service';
import { MessageChunkReference } from './entities/message-chunk-reference.entity';
import { CreateMessageChunkReferenceDto } from './dto/create-message-chunk-reference.dto';
import { UpdateMessageChunkReferenceDto } from './dto/update-message-chunk-reference.dto';

@Resolver(() => MessageChunkReference)
export class MessageChunkReferencesResolver {
  constructor(
    private readonly messageChunkReferencesService: MessageChunkReferencesService,
  ) {}

  @Mutation(() => MessageChunkReference, {
    description: 'Create a new message chunk reference',
  })
  createMessageChunkReference(
    @Args('input') createDto: CreateMessageChunkReferenceDto,
  ): Promise<MessageChunkReference> {
    return this.messageChunkReferencesService.create(createDto);
  }

  @Mutation(() => [MessageChunkReference], {
    description: 'Create multiple message chunk references at once',
  })
  createManyMessageChunkReferences(
    @Args({ name: 'inputs', type: () => [CreateMessageChunkReferenceDto] })
    createDtos: CreateMessageChunkReferenceDto[],
  ): Promise<MessageChunkReference[]> {
    return this.messageChunkReferencesService.createMany(createDtos);
  }

  @Query(() => [MessageChunkReference], {
    name: 'messageChunkReferences',
    description: 'Get all message chunk references',
  })
  findAll(): Promise<MessageChunkReference[]> {
    return this.messageChunkReferencesService.findAll();
  }

  @Query(() => MessageChunkReference, {
    name: 'messageChunkReference',
    description: 'Get a single message chunk reference by ID',
  })
  findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<MessageChunkReference> {
    return this.messageChunkReferencesService.findOne(id);
  }

  @Query(() => [MessageChunkReference], {
    name: 'messageChunkReferencesByMessage',
    description: 'Get all chunk references for a specific message (sources)',
  })
  findByMessageId(
    @Args('messageId', { type: () => ID }) messageId: string,
  ): Promise<MessageChunkReference[]> {
    return this.messageChunkReferencesService.findByMessageId(messageId);
  }

  @Query(() => [MessageChunkReference], {
    name: 'messageChunkReferencesByChunk',
    description: 'Get all messages that used a specific chunk',
  })
  findByChunkId(
    @Args('chunkId', { type: () => ID }) chunkId: string,
  ): Promise<MessageChunkReference[]> {
    return this.messageChunkReferencesService.findByChunkId(chunkId);
  }

  @Mutation(() => MessageChunkReference, {
    description: 'Update a message chunk reference',
  })
  updateMessageChunkReference(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateDto: UpdateMessageChunkReferenceDto,
  ): Promise<MessageChunkReference> {
    return this.messageChunkReferencesService.update(id, updateDto);
  }

  @Mutation(() => MessageChunkReference, {
    description: 'Remove a message chunk reference',
  })
  removeMessageChunkReference(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<MessageChunkReference> {
    return this.messageChunkReferencesService.remove(id);
  }

  @Mutation(() => Boolean, {
    description: 'Remove all chunk references for a message',
  })
  async removeMessageChunkReferencesByMessage(
    @Args('messageId', { type: () => ID }) messageId: string,
  ): Promise<boolean> {
    await this.messageChunkReferencesService.removeByMessageId(messageId);
    return true;
  }
}
