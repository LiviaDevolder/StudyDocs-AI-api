import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_DATABASE: z.string().default('studydocs'),

  // JWT
  JWT_SECRET: z.string().default('your-secret-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Google Cloud Storage (required for file uploads)
  GCS_PROJECT_ID: z.string().min(1, 'GCS_PROJECT_ID is required'),
  GCS_BUCKET_NAME: z.string().min(1, 'GCS_BUCKET_NAME is required'),
  GCS_KEY_FILENAME: z.string().optional(),

  // Redis (required for Bull Queue)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Docling OCR Service
  DOCLING_OCR_URL: z.string().optional(),
  DOCLING_OCR_API_KEY: z.string().optional(),

  // Processing Configuration
  PROCESSING_BATCH_SIZE: z.coerce.number().default(5),
  PROCESSING_CONCURRENCY: z.coerce.number().default(2),
});

export function validate(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
