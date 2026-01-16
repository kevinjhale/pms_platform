import { join } from 'path';
import { LocalAdapter } from './adapters/local-adapter';
import { S3Adapter } from './adapters/s3-adapter';
import type { StorageAdapter, StorageConfig } from './types';

export * from './types';

const adapterCache = new Map<string, StorageAdapter>();

export function createStorageAdapter(config: StorageConfig): StorageAdapter {
  const cacheKey = JSON.stringify(config);

  if (adapterCache.has(cacheKey)) {
    return adapterCache.get(cacheKey)!;
  }

  let adapter: StorageAdapter;

  switch (config.provider) {
    case 'local':
      adapter = new LocalAdapter(config);
      break;
    case 's3':
    case 'r2':
    case 'do_spaces':
      adapter = new S3Adapter(config);
      break;
    default:
      throw new Error(`Unknown storage provider: ${config.provider}`);
  }

  adapterCache.set(cacheKey, adapter);
  return adapter;
}

export function getDefaultConfig(): StorageConfig {
  return {
    provider: 'local',
    localPath: join(process.cwd(), 'public', 'uploads'),
  };
}
