import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  StorageAdapter,
  StorageConfig,
  UploadOptions,
  UploadResult,
  PresignedUrlOptions,
} from '../types';

export class S3Adapter implements StorageAdapter {
  private client: S3Client;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.client = new S3Client({
      region: config.region || 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId!,
        secretAccessKey: config.secretAccessKey!,
      },
      forcePathStyle: !!config.endpoint,
    });
  }

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    const key = this.generateKey(options);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: file,
        ContentType: options.contentType,
        Metadata: options.metadata,
      })
    );

    return {
      key,
      url: this.config.publicUrl ? `${this.config.publicUrl}/${key}` : key,
      provider: this.config.provider,
      bucket: this.config.bucket,
      size: file.length,
      contentType: options.contentType,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })
    );
  }

  async getPresignedUrl(key: string, options: PresignedUrlOptions = {}): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ResponseContentDisposition:
        options.disposition === 'attachment' && options.filename
          ? `attachment; filename="${options.filename}"`
          : undefined,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn || 3600,
    });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  private generateKey(options: UploadOptions): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = options.fileName?.split('.').pop() || 'bin';
    const folder = options.folder || 'uploads';
    return `${options.organizationId}/${folder}/${timestamp}-${random}.${ext}`;
  }
}
