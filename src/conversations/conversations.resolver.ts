import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ConversationsService } from './conversations.service';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationInput } from './dto/create-conversation.dto';
import { UpdateConversationInput } from './dto/update-conversation.dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => Conversation)
@UseGuards(GqlAuthGuard)
export class ConversationsResolver {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Mutation(() => Conversation)
  createConversation(
    @Args('createConversationInput')
    createConversationInput: CreateConversationInput,
  ) {
    return this.conversationsService.create(createConversationInput);
  }

  @Query(() => [Conversation], { name: 'conversations' })
  findAll() {
    return this.conversationsService.findAll();
  }

  @Query(() => Conversation, { name: 'conversation' })
  findOne(@Args('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Query(() => [Conversation], { name: 'conversationsByProject' })
  findByProject(@Args('projectId') projectId: string) {
    return this.conversationsService.findByProject(projectId);
  }

  @Mutation(() => Conversation)
  updateConversation(
    @Args('id') id: string,
    @Args('updateConversationInput')
    updateConversationInput: UpdateConversationInput,
  ) {
    return this.conversationsService.update(id, updateConversationInput);
  }

  @Mutation(() => Boolean)
  removeConversation(@Args('id') id: string) {
    return this.conversationsService.remove(id);
  }
}
