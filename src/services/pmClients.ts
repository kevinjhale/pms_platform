import { eq, and, desc, sql, count } from 'drizzle-orm';
import {
  getDb,
  pmClientRelationships,
  properties,
  units,
  users,
  organizations,
  type PmClientRelationship,
  type NewPmClientRelationship,
} from '@/db';
import { generateId, now } from '@/lib/utils';

export interface PmClient {
  id: string;
  pmUserId: string;
  // On-platform landlord info
  landlordUserId: string | null;
  landlordName: string | null;
  landlordEmail: string | null;
  // External landlord info
  externalLandlordName: string | null;
  externalLandlordEmail: string | null;
  externalLandlordPhone: string | null;
  // Organization
  organizationId: string | null;
  organizationName: string | null;
  // Metadata
  status: string;
  canCreateProperties: boolean;
  notes: string | null;
  // Computed
  displayName: string;
  propertyCount: number;
}

export async function createPmClientRelationship(data: {
  pmUserId: string;
  landlordUserId?: string;
  externalLandlordName?: string;
  externalLandlordEmail?: string;
  externalLandlordPhone?: string;
  organizationId?: string;
  canCreateProperties?: boolean;
  notes?: string;
}): Promise<PmClientRelationship> {
  const db = getDb();
  const id = generateId();
  const timestamp = now();

  const relationship: NewPmClientRelationship = {
    id,
    pmUserId: data.pmUserId,
    landlordUserId: data.landlordUserId || null,
    externalLandlordName: data.externalLandlordName || null,
    externalLandlordEmail: data.externalLandlordEmail || null,
    externalLandlordPhone: data.externalLandlordPhone || null,
    organizationId: data.organizationId || null,
    status: 'active',
    canCreateProperties: data.canCreateProperties ?? true,
    notes: data.notes || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(pmClientRelationships).values(relationship);
  return relationship as PmClientRelationship;
}

export async function getPmClients(pmUserId: string): Promise<PmClient[]> {
  const db = getDb();

  // Get all client relationships for this PM
  const relationships = await db
    .select({
      relationship: pmClientRelationships,
      landlordName: users.name,
      landlordEmail: users.email,
      organizationName: organizations.name,
    })
    .from(pmClientRelationships)
    .leftJoin(users, eq(pmClientRelationships.landlordUserId, users.id))
    .leftJoin(organizations, eq(pmClientRelationships.organizationId, organizations.id))
    .where(
      and(
        eq(pmClientRelationships.pmUserId, pmUserId),
        eq(pmClientRelationships.status, 'active')
      )
    )
    .orderBy(desc(pmClientRelationships.createdAt));

  // Get property counts for each client
  const clientsWithCounts: PmClient[] = await Promise.all(
    relationships.map(async (r) => {
      const rel = r.relationship;

      // Count properties for this client
      let propertyCount = 0;
      if (rel.landlordUserId) {
        const countResult = await db
          .select({ count: count() })
          .from(properties)
          .where(eq(properties.landlordId, rel.landlordUserId));
        propertyCount = countResult[0]?.count || 0;
      }

      // Determine display name
      const displayName = rel.landlordUserId
        ? r.landlordName || r.landlordEmail || 'Unknown Landlord'
        : rel.externalLandlordName || 'External Client';

      return {
        id: rel.id,
        pmUserId: rel.pmUserId,
        landlordUserId: rel.landlordUserId,
        landlordName: r.landlordName,
        landlordEmail: r.landlordEmail,
        externalLandlordName: rel.externalLandlordName,
        externalLandlordEmail: rel.externalLandlordEmail,
        externalLandlordPhone: rel.externalLandlordPhone,
        organizationId: rel.organizationId,
        organizationName: r.organizationName,
        status: rel.status,
        canCreateProperties: rel.canCreateProperties ?? true,
        notes: rel.notes,
        displayName,
        propertyCount,
      };
    })
  );

  return clientsWithCounts;
}

export async function getPmClientById(id: string): Promise<PmClient | null> {
  const db = getDb();

  const result = await db
    .select({
      relationship: pmClientRelationships,
      landlordName: users.name,
      landlordEmail: users.email,
      organizationName: organizations.name,
    })
    .from(pmClientRelationships)
    .leftJoin(users, eq(pmClientRelationships.landlordUserId, users.id))
    .leftJoin(organizations, eq(pmClientRelationships.organizationId, organizations.id))
    .where(eq(pmClientRelationships.id, id))
    .limit(1);

  if (!result[0]) return null;

  const r = result[0];
  const rel = r.relationship;

  // Count properties
  let propertyCount = 0;
  if (rel.landlordUserId) {
    const countResult = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.landlordId, rel.landlordUserId));
    propertyCount = countResult[0]?.count || 0;
  }

  const displayName = rel.landlordUserId
    ? r.landlordName || r.landlordEmail || 'Unknown Landlord'
    : rel.externalLandlordName || 'External Client';

  return {
    id: rel.id,
    pmUserId: rel.pmUserId,
    landlordUserId: rel.landlordUserId,
    landlordName: r.landlordName,
    landlordEmail: r.landlordEmail,
    externalLandlordName: rel.externalLandlordName,
    externalLandlordEmail: rel.externalLandlordEmail,
    externalLandlordPhone: rel.externalLandlordPhone,
    organizationId: rel.organizationId,
    organizationName: r.organizationName,
    status: rel.status,
    canCreateProperties: rel.canCreateProperties ?? true,
    notes: rel.notes,
    displayName,
    propertyCount,
  };
}

export async function canPmCreatePropertyForClient(
  pmUserId: string,
  clientId: string
): Promise<{ allowed: boolean; organizationId?: string; landlordId?: string }> {
  const db = getDb();

  const result = await db
    .select()
    .from(pmClientRelationships)
    .where(
      and(
        eq(pmClientRelationships.id, clientId),
        eq(pmClientRelationships.pmUserId, pmUserId),
        eq(pmClientRelationships.status, 'active')
      )
    )
    .limit(1);

  if (!result[0] || !result[0].canCreateProperties) {
    return { allowed: false };
  }

  return {
    allowed: true,
    organizationId: result[0].organizationId || undefined,
    landlordId: result[0].landlordUserId || undefined,
  };
}

export async function updatePmClientRelationship(
  id: string,
  data: Partial<Pick<PmClientRelationship, 'status' | 'canCreateProperties' | 'notes' | 'organizationId'>>
): Promise<void> {
  const db = getDb();
  await db
    .update(pmClientRelationships)
    .set({ ...data, updatedAt: now() })
    .where(eq(pmClientRelationships.id, id));
}

export async function deletePmClientRelationship(id: string): Promise<void> {
  const db = getDb();
  await db.delete(pmClientRelationships).where(eq(pmClientRelationships.id, id));
}
