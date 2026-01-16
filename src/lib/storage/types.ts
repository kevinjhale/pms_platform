export type StorageProvider = 'local' | 's3' | 'r2' | 'do_spaces';

export interface StorageConfig {
  provider: StorageProvider;
  bucket?: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string;
  localPath?: string;
}

export interface UploadOptions {
  contentType: string;
  organizationId: string;
  folder?: string;
  fileName?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;
  provider: StorageProvider;
  bucket?: string;
  size: number;
  contentType: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number;
  disposition?: 'inline' | 'attachment';
  filename?: string;
}

export interface StorageAdapter {
  upload(file: Buffer, options: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getPresignedUrl(key: string, options?: PresignedUrlOptions): Promise<string>;
  exists(key: string): Promise<boolean>;
}

export interface StorageSettings {
  provider: StorageProvider;
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
}
