import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageChunkReferencesService } from './message-chunk-references.service';
import { MessageChunkReferencesResolver } from './message-chunk-references.resolver';
import { MessageChunkReference } from './entities/message-chunk-reference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageChunkReference])],
  providers: [MessageChunkReferencesService, MessageChunkReferencesResolver],
  exports: [MessageChunkReferencesService],
})
export class MessageChunkReferencesModule {}
