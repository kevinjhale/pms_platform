/**
 * Migration script to convert existing maintenance photos to the documents system
 *
 * This script:
 * 1. Finds all maintenance requests with photos
 * 2. Creates document records for each photo
 * 3. Links them to the maintenance request
 *
 * Run with: npx tsx scripts/migrate-maintenance-photos.ts
 */

import { eq, isNotNull, sql } from 'drizzle-orm';
import { getDb, maintenanceRequests, documents, units, properties } from '@/db';
import { generateId, now } from '@/lib/utils';

async function migrateMaintenancePhotos() {
  const db = getDb();

  console.log('Starting maintenance photo migration...\n');

  // Get all maintenance requests with photos, including their organization
  const requests = await db
    .select({
      id: maintenanceRequests.id,
      photos: maintenanceRequests.photos,
      unitId: maintenanceRequests.unitId,
      requestedBy: maintenanceRequests.requestedBy,
      createdAt: maintenanceRequests.createdAt,
    })
    .from(maintenanceRequests)
    .where(isNotNull(maintenanceRequests.photos));

  console.log(`Found ${requests.length} maintenance requests with photos\n`);

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const request of requests) {
    const photos = request.photos as string[] | null;
    if (!photos || photos.length === 0) {
      totalSkipped++;
      continue;
    }

    // Get organization ID through unit -> property
    const unitData = await db
      .select({
        organizationId: properties.organizationId,
      })
      .from(units)
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(eq(units.id, request.unitId))
      .limit(1);

    if (unitData.length === 0) {
      console.log(`  Warning: Could not find organization for request ${request.id}`);
      totalErrors++;
      continue;
    }

    const organizationId = unitData[0].organizationId;

    for (const photoUrl of photos) {
      // Extract key from URL (e.g., /uploads/maintenance/1234-abc.jpg -> maintenance/1234-abc.jpg)
      const storageKey = photoUrl.replace('/uploads/', '');

      // Check if already migrated
      const existing = await db
        .select({ id: documents.id })
        .from(documents)
        .where(eq(documents.storageKey, storageKey))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  Skipping (already exists): ${storageKey}`);
        totalSkipped++;
        continue;
      }

      // Determine mime type from extension
      const ext = storageKey.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      };
      const mimeType = mimeTypes[ext || ''] || 'application/octet-stream';

      // Create document record
      const timestamp = request.createdAt || now();
      await db.insert(documents).values({
        id: generateId(),
        organizationId,
        entityType: 'maintenance_request',
        entityId: request.id,
        documentType: 'maintenance_photo',
        fileName: storageKey.split('/').pop() || 'photo.jpg',
        fileSize: 0, // Unknown for existing files
        mimeType,
        storageProvider: 'local',
        storageKey,
        isPublic: true,
        uploadedBy: request.requestedBy,
        createdAt: timestamp,
        updatedAt: now(),
      });

      console.log(`  Migrated: ${storageKey}`);
      totalMigrated++;
    }
  }

  console.log('\n--- Migration Complete ---');
  console.log(`Migrated: ${totalMigrated} photos`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log(`Errors: ${totalErrors}`);
}

migrateMaintenancePhotos()
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
