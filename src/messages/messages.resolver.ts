import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { CreateMessageInput } from './dto/create-message.dto';
import { UpdateMessageInput } from './dto/update-message.dto';

@Resolver(() => Message)
export class MessagesResolver {
  constructor(private readonly messagesService: MessagesService) {}

  @Mutation(() => Message)
  async createMessage(
    @Args('createMessageInput') createMessageInput: CreateMessageInput,
  ): Promise<Message> {
    return await this.messagesService.create(createMessageInput);
  }

  @Query(() => [Message], { name: 'messages' })
  async findAll(): Promise<Message[]> {
    return await this.messagesService.findAll();
  }

  @Query(() => Message, { name: 'message' })
  async findOne(@Args('id') id: string): Promise<Message> {
    return await this.messagesService.findOne(id);
  }

  @Query(() => [Message], { name: 'messagesByProject' })
  async findByProject(
    @Args('projectId') projectId: string,
  ): Promise<Message[]> {
    return await this.messagesService.findByProject(projectId);
  }

  @Mutation(() => Message)
  async updateMessage(
    @Args('id') id: string,
    @Args('updateMessageInput') updateMessageInput: UpdateMessageInput,
  ): Promise<Message> {
    return await this.messagesService.update(id, updateMessageInput);
  }

  @Mutation(() => Boolean)
  async removeMessage(@Args('id') id: string): Promise<boolean> {
    return await this.messagesService.remove(id);
  }
}
