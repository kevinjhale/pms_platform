import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { importAllProperties, type PropertyGroup, type ImportResult } from '@/services/csvImport';
import { canPmCreatePropertyForClient } from '@/services/pmClients';

interface ImportRequest {
  groups: PropertyGroup[];
  organizationId: string;
  landlordId?: string;
  clientId?: string;
}

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

    const body: ImportRequest = await request.json();
    const { groups, organizationId, landlordId, clientId } = body;

    // Verify organization matches session context
    if (organizationId !== organization.id) {
      return NextResponse.json({ error: 'Organization mismatch' }, { status: 403 });
    }

    // Validate groups
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json({ error: 'No properties to import' }, { status: 400 });
    }

    // For property managers, verify they can create properties for the client
    const isPlatformManager = session.user.role === 'manager';
    if (isPlatformManager && clientId) {
      const check = await canPmCreatePropertyForClient(session.user.id, clientId);
      if (!check.allowed) {
        return NextResponse.json(
          { error: 'Not authorized to create properties for this client' },
          { status: 403 }
        );
      }
    }

    // Perform the import
    const result: ImportResult = await importAllProperties(
      groups,
      organizationId,
      landlordId,
      isPlatformManager ? session.user.id : undefined // createdByUserId for PMs
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
