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

  // GCP (optional)
  VERTEX_API_KEY: z.string().optional(),
});

export function validate(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
