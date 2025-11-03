import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GcsService } from './services/gcs.service';
import { DoclingService } from './services/docling.service';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingsService } from './services/embeddings.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GcsService, DoclingService, ChunkingService, EmbeddingsService],
  exports: [GcsService, DoclingService, ChunkingService, EmbeddingsService],
})
export class CommonModule {}
