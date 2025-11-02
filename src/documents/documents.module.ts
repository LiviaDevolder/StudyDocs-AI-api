import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsResolver } from './documents.resolver';
import { Document } from './entities/document.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document]), CommonModule],
  providers: [DocumentsResolver, DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
