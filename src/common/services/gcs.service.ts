import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, Bucket } from '@google-cloud/storage';
import { randomUUID } from 'crypto';

export interface UploadFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface UploadedFileInfo {
  fileName: string;
  gcsPath: string;
  publicUrl: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class GcsService {
  private readonly logger = new Logger(GcsService.name);
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('gcs.projectId');
    const bucketName = this.configService.get<string>('gcs.bucketName');
    const keyFilename = this.configService.get<string>('gcs.keyFilename');

    if (!projectId) {
      this.logger.error(
        'GCS_PROJECT_ID is not configured in environment variables',
      );
      throw new Error(
        'GCS_PROJECT_ID is not configured. Please set it in your .env file.',
      );
    }

    if (!bucketName) {
      this.logger.error(
        'GCS_BUCKET_NAME is not configured in environment variables',
      );
      throw new Error(
        'GCS_BUCKET_NAME is not configured. Please set it in your .env file.',
      );
    }

    this.bucketName = bucketName;

    try {
      // Se keyFilename não estiver definido, usa Application Default Credentials
      this.storage = new Storage({
        projectId,
        ...(keyFilename && { keyFilename }),
      });

      this.bucket = this.storage.bucket(bucketName);

      this.logger.log(`GCS initialized successfully`);
      this.logger.log(`  Project ID: ${projectId}`);
      this.logger.log(`  Bucket: ${bucketName}`);
      this.logger.log(
        `  Auth: ${keyFilename ? 'Service Account Key' : 'Application Default Credentials'}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize GCS Storage', error);
      throw new Error(
        `Failed to initialize Google Cloud Storage: ${error.message}`,
      );
    }
  }

  async uploadFile(
    file: UploadFileInput,
    folder: string = 'documents',
  ): Promise<UploadedFileInfo> {
    try {
      const fileName = this.generateFileName(file.originalname);
      const gcsPath = `${folder}/${fileName}`;
      const blob = this.bucket.file(gcsPath);

      this.logger.log(`Uploading file: ${gcsPath}`);

      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      return new Promise((resolve, reject): void => {
        blobStream.on('error', (error) => {
          this.logger.error(`Upload error: ${error.message}`);
          reject(error);
        });

        blobStream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${gcsPath}`;

          const uploadedFileInfo: UploadedFileInfo = {
            fileName,
            gcsPath,
            publicUrl,
            size: file.size,
            mimeType: file.mimetype,
          };

          this.logger.log(`File uploaded successfully: ${gcsPath}`);
          resolve(uploadedFileInfo);
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  async downloadFile(gcsPath: string): Promise<Buffer> {
    try {
      this.logger.log(`Downloading file from GCS: ${gcsPath}`);
      const file = this.bucket.file(gcsPath);
      const [buffer] = await file.download();
      this.logger.log(
        `File downloaded successfully: ${gcsPath} (${buffer.length} bytes)`,
      );
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download file ${gcsPath}: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(gcsPath: string): Promise<void> {
    try {
      await this.bucket.file(gcsPath).delete();
      this.logger.log(`File deleted: ${gcsPath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${gcsPath}: ${error.message}`);
      throw error;
    }
  }

  async getSignedUrl(gcsPath: string, expiresIn: number = 60): Promise<string> {
    try {
      const [url] = await this.bucket.file(gcsPath).getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 60 * 1000,
      });
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for ${gcsPath}: ${error.message}`,
      );
      throw error;
    }
  }

  async fileExists(gcsPath: string): Promise<boolean> {
    try {
      const [exists] = await this.bucket.file(gcsPath).exists();
      return exists;
    } catch (error) {
      this.logger.error(
        `Failed to check file existence ${gcsPath}: ${error.message}`,
      );
      return false;
    }
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const uuid = randomUUID();
    const extension = originalName.split('.').pop();
    const baseName = originalName
      .split('.')
      .slice(0, -1)
      .join('.')
      .replace(/[^a-zA-Z0-9]/g, '_');
    return `${baseName}_${timestamp}_${uuid}.${extension}`;
  }
}
