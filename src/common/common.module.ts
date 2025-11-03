import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GcsService } from './services/gcs.service';
import { DoclingService } from './services/docling.service';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingsService } from './services/embeddings.service';
import { DoclingOcrService } from './services/docling-ocr.service';
import { TextExtractionService } from './services/text-extraction.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    GcsService,
    DoclingService,
    ChunkingService,
    EmbeddingsService,
    DoclingOcrService,
    TextExtractionService,
  ],
  exports: [
    GcsService,
    DoclingService,
    ChunkingService,
    EmbeddingsService,
    DoclingOcrService,
    TextExtractionService,
  ],
})
export class CommonModule {}
