import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derive encryption key from AUTH_SECRET
 * Uses scrypt for key derivation with a fixed salt for deterministic key generation
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters for encryption');
  }
  // Fixed salt for deterministic key derivation across restarts
  const salt = Buffer.from('pms_integration_settings_v1');
  return scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns base64-encoded string containing IV + ciphertext + auth tag
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: base64(iv + encrypted + tag)
  const combined = Buffer.concat([iv, encrypted, tag]);
  return combined.toString('base64');
}

/**
 * Decrypt a base64-encoded ciphertext string
 * Expects format: base64(iv + encrypted + tag)
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(ciphertext, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(-TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH, -TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Safe decryption that returns null on failure
 * Useful when key may have changed or data is corrupted
 */
export function safeDecrypt(ciphertext: string): string | null {
  try {
    return decrypt(ciphertext);
  } catch {
    console.error('[Crypto] Decryption failed - key may have changed or data corrupted');
    return null;
  }
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  const secret = process.env.AUTH_SECRET;
  return !!secret && secret.length >= 32;
}
