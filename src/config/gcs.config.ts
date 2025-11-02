import { registerAs } from '@nestjs/config';

export default registerAs('gcs', () => ({
  projectId: process.env.GCS_PROJECT_ID,
  bucketName: process.env.GCS_BUCKET_NAME,
  keyFilename: process.env.GCS_KEY_FILENAME,
}));
