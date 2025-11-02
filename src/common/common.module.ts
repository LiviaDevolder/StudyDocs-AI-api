import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GcsService } from './services/gcs.service';
import { DoclingService } from './services/docling.service';
import { ChunkingService } from './services/chunking.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GcsService, DoclingService, ChunkingService],
  exports: [GcsService, DoclingService, ChunkingService],
})
export class CommonModule {}
