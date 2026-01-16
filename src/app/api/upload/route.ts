import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { getStorageAdapter } from '@/services/storage';
import { createDocument } from '@/services/documents';
import type { DocumentEntityType, DocumentType } from '@/db/schema/documents';

// Configure max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization } = await getOrgContext();
    if (!organization) {
      return NextResponse.json({ error: 'No organization context' }, { status: 400 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    // Get metadata from form (with defaults for backward compatibility)
    const entityType = (formData.get('entityType') as DocumentEntityType) || 'maintenance_request';
    const entityId = (formData.get('entityId') as string) || 'pending';
    const documentType = (formData.get('documentType') as DocumentType) || 'maintenance_photo';
    const folder = (formData.get('folder') as string) || 'maintenance';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Validate files
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} has unsupported type` },
          { status: 400 }
        );
      }
    }

    const storage = await getStorageAdapter(organization.id);
    const uploadedDocs: Array<{ id: string; url: string; fileName: string }> = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await storage.upload(buffer, {
        contentType: file.type,
        organizationId: organization.id,
        folder,
        fileName: file.name,
      });

      // Create document record
      const doc = await createDocument({
        organizationId: organization.id,
        entityType,
        entityId,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageProvider: result.provider,
        storageKey: result.key,
        storageBucket: result.bucket,
        uploadedBy: session.user.id,
        isPublic: result.provider === 'local',
      });

      uploadedDocs.push({
        id: doc.id,
        url: result.url,
        fileName: file.name,
      });
    }

    return NextResponse.json({
      documents: uploadedDocs,
      // Backward compatibility: return urls array for existing components
      urls: uploadedDocs.map((d) => d.url),
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
