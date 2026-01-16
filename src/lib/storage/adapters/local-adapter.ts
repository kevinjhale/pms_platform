import { writeFile, unlink, access, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type {
  StorageAdapter,
  StorageConfig,
  UploadOptions,
  UploadResult,
  PresignedUrlOptions,
} from '../types';

export class LocalAdapter implements StorageAdapter {
  private basePath: string;

  constructor(config: StorageConfig) {
    this.basePath = config.localPath || join(process.cwd(), 'public', 'uploads');
  }

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    const key = this.generateKey(options);
    const fullPath = join(this.basePath, key);

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file);

    return {
      key,
      url: `/uploads/${key}`,
      provider: 'local',
      size: file.length,
      contentType: options.contentType,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = join(this.basePath, key);
    try {
      await unlink(fullPath);
    } catch {
      // File may not exist
    }
  }

  async getPresignedUrl(key: string, _options?: PresignedUrlOptions): Promise<string> {
    return `/uploads/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = join(this.basePath, key);
    try {
      await access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  private generateKey(options: UploadOptions): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = options.fileName?.split('.').pop() || 'bin';
    const folder = options.folder || 'general';
    return `${options.organizationId}/${folder}/${timestamp}-${random}.${ext}`;
  }
}
