import { eq, and, inArray } from 'drizzle-orm';
import { getDb, documents } from '@/db';
import type { Document, NewDocument, DocumentEntityType, DocumentType } from '@/db/schema/documents';
import { generateId, now } from '@/lib/utils';
import { getStorageAdapter } from './storage';

export type { Document, NewDocument, DocumentEntityType, DocumentType };

/**
 * Create a new document record
 */
export async function createDocument(
  data: Omit<NewDocument, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Document> {
  const db = getDb();
  const timestamp = now();
  const id = generateId();

  await db.insert(documents).values({
    ...data,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const result = await db.select().from(documents).where(eq(documents.id, id));
  return result[0];
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string): Promise<Document | null> {
  const db = getDb();
  const results = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return results[0] || null;
}

/**
 * Get documents by entity (e.g., all photos for a maintenance request)
 */
export async function getDocumentsByEntity(
  entityType: DocumentEntityType,
  entityId: string
): Promise<Document[]> {
  const db = getDb();
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.entityType, entityType), eq(documents.entityId, entityId)));
}

/**
 * Get documents by organization
 */
export async function getDocumentsByOrganization(organizationId: string): Promise<Document[]> {
  const db = getDb();
  return db.select().from(documents).where(eq(documents.organizationId, organizationId));
}

/**
 * Delete a document (from storage and database)
 */
export async function deleteDocument(id: string): Promise<void> {
  const db = getDb();
  const doc = await getDocumentById(id);

  if (doc) {
    // Delete from storage
    const storage = await getStorageAdapter(doc.organizationId);
    await storage.delete(doc.storageKey);

    // Delete from database
    await db.delete(documents).where(eq(documents.id, id));
  }
}

/**
 * Delete multiple documents
 */
export async function deleteDocuments(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const db = getDb();
  const docs = await db.select().from(documents).where(inArray(documents.id, ids));

  // Delete from storage
  for (const doc of docs) {
    const storage = await getStorageAdapter(doc.organizationId);
    await storage.delete(doc.storageKey);
  }

  // Delete from database
  await db.delete(documents).where(inArray(documents.id, ids));
}

/**
 * Update document's entity reference (e.g., when attaching pending uploads to a new entity)
 */
export async function updateDocumentEntity(
  documentIds: string[],
  entityType: DocumentEntityType,
  entityId: string
): Promise<void> {
  if (documentIds.length === 0) return;

  const db = getDb();
  await db
    .update(documents)
    .set({
      entityId,
      entityType,
      updatedAt: now(),
    })
    .where(inArray(documents.id, documentIds));
}

/**
 * Get document URLs for display (handles presigned URLs for cloud storage)
 */
export async function getDocumentUrls(
  docs: Document[]
): Promise<Array<{ id: string; url: string; fileName: string; mimeType: string }>> {
  if (docs.length === 0) return [];

  const results: Array<{ id: string; url: string; fileName: string; mimeType: string }> = [];

  for (const doc of docs) {
    if (doc.storageProvider === 'local') {
      results.push({
        id: doc.id,
        url: `/uploads/${doc.storageKey}`,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
      });
    } else {
      const storage = await getStorageAdapter(doc.organizationId);
      const url = await storage.getPresignedUrl(doc.storageKey, { expiresIn: 3600 });
      results.push({
        id: doc.id,
        url,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
      });
    }
  }

  return results;
}

/**
 * Get a single document URL
 */
export async function getDocumentUrl(doc: Document): Promise<string> {
  if (doc.storageProvider === 'local') {
    return `/uploads/${doc.storageKey}`;
  }

  const storage = await getStorageAdapter(doc.organizationId);
  return storage.getPresignedUrl(doc.storageKey, { expiresIn: 3600 });
}

/**
 * Get documents with URLs in one call
 */
export async function getDocumentsWithUrls(
  entityType: DocumentEntityType,
  entityId: string
): Promise<Array<Document & { url: string }>> {
  const docs = await getDocumentsByEntity(entityType, entityId);
  const urls = await getDocumentUrls(docs);

  return docs.map((doc, i) => ({
    ...doc,
    url: urls[i].url,
  }));
}

/**
 * Count documents for an entity
 */
export async function countDocuments(
  entityType: DocumentEntityType,
  entityId: string
): Promise<number> {
  const docs = await getDocumentsByEntity(entityType, entityId);
  return docs.length;
}

/**
 * Get documents by type for an entity
 */
export async function getDocumentsByType(
  entityType: DocumentEntityType,
  entityId: string,
  documentType: DocumentType
): Promise<Document[]> {
  const db = getDb();
  return db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.entityType, entityType),
        eq(documents.entityId, entityId),
        eq(documents.documentType, documentType)
      )
    );
}
