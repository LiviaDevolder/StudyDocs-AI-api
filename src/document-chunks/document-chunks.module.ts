import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunk } from './entities/document-chunk.entity';
import { Document } from '../documents/entities/document.entity';
import { DocumentChunksService } from './document-chunks.service';
import { DocumentChunksResolver } from './document-chunks.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentChunk, Document])],
  providers: [DocumentChunksResolver, DocumentChunksService],
  exports: [DocumentChunksService],
})
export class DocumentChunksModule {}
