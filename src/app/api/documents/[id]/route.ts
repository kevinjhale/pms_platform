import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { getDocumentById, deleteDocument } from '@/services/documents';

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

    if (doc.organizationId !== organization.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json({ error: 'Failed to get document' }, { status: 500 });
  }
}

export async function DELETE(
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

    if (doc.organizationId !== organization.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await deleteDocument(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
