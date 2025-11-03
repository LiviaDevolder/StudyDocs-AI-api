import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  dimension: number;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  totalTokens?: number;
}

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly projectId: string;
  private readonly location: string;
  private readonly model: string;
  private readonly dimension: number;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.projectId = this.configService.get<string>('vertexai.projectId') || '';
    this.location = this.configService.get<string>('vertexai.location') || 'us-central1';
    this.model = this.configService.get<string>('vertexai.embeddingModel') || 'text-embedding-004';
    this.dimension = this.configService.get<number>('vertexai.embeddingDimension') || 768;
    this.apiKey = this.configService.get<string>('vertexai.apiKey') || '';

    if (!this.apiKey) {
      this.logger.warn('VERTEX_AI_API_KEY not configured. Embeddings will not work.');
    }

    this.logger.log(
      `Vertex AI configured: project=${this.projectId}, location=${this.location}, model=${this.model}`,
    );
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      if (!this.apiKey) {
        throw new Error('VERTEX_AI_API_KEY is not configured');
      }

      // text-embedding-004 has a limit of ~20k characters
      const maxLength = 20000;
      const truncatedText = text.length > maxLength 
        ? text.substring(0, maxLength) 
        : text;

      if (text.length > maxLength) {
        this.logger.warn(
          `Text truncated from ${text.length} to ${maxLength} characters`,
        );
      }

      return await this.generateEmbeddingViaREST(truncatedText);
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding: ${error.message}`,
        error.stack,
      );
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate embedding using REST API with API Key
   */
  private async generateEmbeddingViaREST(text: string): Promise<EmbeddingResult> {
    const axios = require('axios');
    
    const url = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}:predict`;

    try {
      const response = await axios.post(
        url,
        {
          instances: [{ content: text }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
        },
      );

      const prediction = response.data?.predictions?.[0];
      const embedding = prediction?.embeddings?.values || prediction?.values || [];

      if (!embedding || embedding.length === 0) {
        throw new Error('No embedding returned from API');
      }

      this.logger.debug(
        `Generated embedding with ${embedding.length} dimensions`,
      );

      return {
        embedding,
        text,
        dimension: embedding.length,
      };
    } catch (error) {
      this.logger.error(
        `REST API embedding failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param texts Array of texts to generate embeddings for
   * @param batchSize Number of texts to process in parallel (default: 5)
   * @returns Batch embedding results
   */
  async generateEmbeddingsBatch(
    texts: string[],
    batchSize: number = 5,
  ): Promise<BatchEmbeddingResult> {
    try {
      if (!texts || texts.length === 0) {
        return { embeddings: [] };
      }

      const results: EmbeddingResult[] = [];
      
      // Process in batches to avoid rate limits
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        this.logger.debug(
          `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} texts)`,
        );

        const batchPromises = batch.map((text) =>
          this.generateEmbedding(text).catch((error) => {
            this.logger.error(`Failed to embed text: ${error.message}`);
            return null;
          }),
        );

        const batchResults = await Promise.all(batchPromises);
        
        // Filter out failed embeddings
        const validResults = batchResults.filter(
          (result): result is EmbeddingResult => result !== null,
        );
        
        results.push(...validResults);

        // Small delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      this.logger.log(
        `Generated ${results.length}/${texts.length} embeddings successfully`,
      );

      return {
        embeddings: results,
      };
    } catch (error) {
      this.logger.error(
        `Batch embedding generation failed: ${error.message}`,
        error.stack,
      );
      throw new Error(`Batch embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param embedding1 First embedding vector
   * @param embedding2 Second embedding vector
   * @returns Similarity score between 0 and 1
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Get the configured embedding dimension
   */
  getEmbeddingDimension(): number {
    return this.dimension;
  }

  /**
   * Get the model name
   */
  getModelName(): string {
    return this.model;
  }
}
