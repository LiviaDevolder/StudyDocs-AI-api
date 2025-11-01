import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesResolver } from './messages.resolver';
import { Message } from './entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  providers: [MessagesResolver, MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
