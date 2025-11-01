import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunk } from './entities/document-chunk.entity';

import { DocumentChunksService } from './document-chunks.service';
import { DocumentChunksResolver } from './document-chunks.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentChunk])],
  providers: [DocumentChunksResolver, DocumentChunksService],
  exports: [],
})
export class DocumentChunksModule {}
