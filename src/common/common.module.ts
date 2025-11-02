import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GcsService } from './services/gcs.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GcsService],
  exports: [GcsService],
})
export class CommonModule {}
