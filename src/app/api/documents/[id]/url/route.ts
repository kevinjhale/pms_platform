import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { getDocumentById, getDocumentUrl } from '@/services/documents';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization } = await getOrgContext();
    if (!organization) {
      return NextResponse.json({ error: 'No organization context' }, { status: 400 });
    }

    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify organization access
    if (doc.organizationId !== organization.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const url = await getDocumentUrl(doc);

    return NextResponse.json({
      url,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      expiresIn: doc.storageProvider === 'local' ? null : 3600,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
  }
}
