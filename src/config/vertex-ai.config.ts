import { registerAs } from '@nestjs/config';

export default registerAs('vertexai', () => ({
  projectId: process.env.VERTEX_AI_PROJECT_ID || process.env.GCS_PROJECT_ID,
  location: process.env.VERTEX_AI_LOCATION || 'us-central1',
  apiKey: process.env.VERTEX_AI_API_KEY,
  embeddingModel: 'text-embedding-004',
  embeddingDimension: 768, // text-embedding-004 has 768 dimensions
}));
