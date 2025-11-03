import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from './entities/document-chunk.entity';
import { CreateDocumentChunkInput } from './dto/create-document-chunk.dto';
import { UpdateDocumentChunkInput } from './dto/update-document-chunk.dto';
import { DoclingService, OutputFormat } from '../common/services/docling.service';
import { ChunkingService, ChunkOptions } from '../common/services/chunking.service';
import { EmbeddingsService } from '../common/services/embeddings.service';
import { Document } from '../documents/entities/document.entity';

export interface ProcessDocumentResult {
  totalChunks: number;
  successfulChunks: number;
  failedChunks: number;
  chunks: DocumentChunk[];
}

export interface ProcessingOptions {
  chunkingOptions?: ChunkOptions;
  outputFormat?: OutputFormat;
  batchSize?: number;
}

@Injectable()
export class DocumentChunksService {
  private readonly logger = new Logger(DocumentChunksService.name);

  constructor(
    @InjectRepository(DocumentChunk)
    private readonly documentChunkRepository: Repository<DocumentChunk>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private doclingService: DoclingService,
    private chunkingService: ChunkingService,
    private embeddingsService: EmbeddingsService,
  ) {}

  async create(
    createDocumentChunkInput: CreateDocumentChunkInput,
  ): Promise<DocumentChunk> {
    const documentChunk = this.documentChunkRepository.create(
      createDocumentChunkInput,
    );
    return await this.documentChunkRepository.save(documentChunk);
  }

  async findAll(): Promise<DocumentChunk[]> {
    return await this.documentChunkRepository.find();
  }

  async findOne(id: string): Promise<DocumentChunk> {
    const documentChunk = await this.documentChunkRepository.findOne({
      where: { id },
    });

    if (!documentChunk) {
      throw new NotFoundException(`DocumentChunk with ID ${id} not found`);
    }

    return documentChunk;
  }

  async findByDocument(documentId: string): Promise<DocumentChunk[]> {
    return await this.documentChunkRepository.find({
      where: { documentId },
    });
  }

  async update(
    id: string,
    updateDocumentChunkInput: UpdateDocumentChunkInput,
  ): Promise<DocumentChunk> {
    const documentChunk = await this.findOne(id);
    Object.assign(documentChunk, updateDocumentChunkInput);
    return await this.documentChunkRepository.save(documentChunk);
  }

  async remove(id: string): Promise<boolean> {
    const documentChunk = await this.findOne(id);
    await this.documentChunkRepository.remove(documentChunk);
    return true;
  }

  async processDocument(
    documentId: string,
    fileBuffer: Buffer,
    fileName: string,
    options: ProcessingOptions = {},
  ): Promise<ProcessDocumentResult> {
    this.logger.log(`Starting processing for document ${documentId}`);

    try {
      this.logger.debug('Step 1: Extracting text with Docling');
      const extractionResult = await this.doclingService.extractText(
        fileBuffer,
        fileName,
        options.outputFormat || OutputFormat.TEXT,
      );

      const { content, format } = extractionResult;
      this.logger.log(`Extracted ${content.length} characters in ${format} format`);

      this.logger.debug('Step 2: Chunking text');
      const chunks =
        format === OutputFormat.MARKDOWN
          ? this.chunkingService.chunkMarkdown(content, options.chunkingOptions)
          : this.chunkingService.chunkText(content, options.chunkingOptions);

      this.logger.log(`Created ${chunks.length} chunks`);

      this.logger.debug('Step 3: Generating embeddings');
      const chunkTexts = chunks.map((chunk) => chunk.content);
      const embeddingResult = await this.embeddingsService.generateEmbeddingsBatch(
        chunkTexts,
        options.batchSize || 5,
      );

      this.logger.log(
        `Generated ${embeddingResult.embeddings.length}/${chunks.length} embeddings`,
      );

      this.logger.debug('Step 4: Saving chunks to database');
      const documentChunks: DocumentChunk[] = [];
      let successfulChunks = 0;
      let failedChunks = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddingResult.embeddings.find(
          (e) => e.text === chunk.content,
        );

        if (!embedding) {
          this.logger.warn(`No embedding found for chunk ${i}, skipping`);
          failedChunks++;
          continue;
        }

        try {
          const documentChunk = this.documentChunkRepository.create({
            documentId,
            content: chunk.content,
            embedding: embedding.embedding,
            metadata: {
              ...chunk.metadata,
              embeddingModel: this.embeddingsService.getModelName(),
              embeddingDimension: embedding.dimension,
              extractionFormat: format,
              chunkIndex: i,
              totalChunks: chunks.length,
            },
          });

          const savedChunk = await this.documentChunkRepository.save(documentChunk);
          documentChunks.push(savedChunk);
          successfulChunks++;
        } catch (error) {
          this.logger.error(
            `Failed to save chunk ${i}: ${error.message}`,
            error.stack,
          );
          failedChunks++;
        }
      }

      this.logger.log(
        `Processing complete: ${successfulChunks} saved, ${failedChunks} failed`,
      );

      return {
        totalChunks: chunks.length,
        successfulChunks,
        failedChunks,
        chunks: documentChunks,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process document ${documentId}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  async processDocumentsBatch(
    documents: Array<{
      documentId: string;
      fileBuffer: Buffer;
      fileName: string;
    }>,
    options: ProcessingOptions = {},
  ): Promise<ProcessDocumentResult[]> {
    this.logger.log(`Starting batch processing for ${documents.length} documents`);

    const results: ProcessDocumentResult[] = [];

    for (const doc of documents) {
      try {
        const result = await this.processDocument(
          doc.documentId,
          doc.fileBuffer,
          doc.fileName,
          options,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to process document ${doc.documentId}: ${error.message}`,
        );
        results.push({
          totalChunks: 0,
          successfulChunks: 0,
          failedChunks: 0,
          chunks: [],
        });
      }
    }

    this.logger.log(`Batch processing complete: ${results.length} documents processed`);

    return results;
  }

  async findSimilarChunks(
    queryText: string,
    limit: number = 10,
    documentId?: string,
    similarityThreshold: number = 0.7,
  ): Promise<Array<DocumentChunk & { similarity: number }>> {
    try {
      const queryEmbedding = await this.embeddingsService.generateEmbedding(queryText);

      let query = this.documentChunkRepository
        .createQueryBuilder('chunk')
        .select('chunk.*')
        .addSelect(
          `1 - (chunk.embedding <=> '[${queryEmbedding.embedding.join(',')}]')`,
          'similarity',
        )
        .where('chunk.embedding IS NOT NULL');

      if (documentId) {
        query = query.andWhere('chunk.documentId = :documentId', { documentId });
      }

      query = query
        .having('similarity >= :threshold', { threshold: similarityThreshold })
        .orderBy('similarity', 'DESC')
        .limit(limit);

      const chunks = await query.getRawMany();

      return chunks.map((chunk) => ({
        ...chunk,
        similarity: parseFloat(chunk.similarity),
      }));
    } catch (error) {
      this.logger.error(
        `Failed to find similar chunks: ${error.message}`,
        error.stack,
      );
      throw new Error(`Similarity search failed: ${error.message}`);
    }
  }

  async deleteByDocumentId(documentId: string): Promise<number> {
    const result = await this.documentChunkRepository.delete({ documentId });
    return result.affected || 0;
  }

  async getDocumentChunkStats(documentId: string): Promise<{
    totalChunks: number;
    chunksWithEmbeddings: number;
    averageChunkLength: number;
    totalCharacters: number;
  }> {
    const chunks = await this.findByDocument(documentId);

    const totalChunks = chunks.length;
    const chunksWithEmbeddings = chunks.filter((c) => c.embedding).length;
    const totalCharacters = chunks.reduce((sum, c) => sum + c.content.length, 0);
    const averageChunkLength =
      totalChunks > 0 ? Math.round(totalCharacters / totalChunks) : 0;

    return {
      totalChunks,
      chunksWithEmbeddings,
      averageChunkLength,
      totalCharacters,
    };
  }
}
