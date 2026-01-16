import { eq, and, desc, count, sql, or, inArray } from 'drizzle-orm';
import { getDb, properties, units, propertyManagers, unitPhotos, pmClientRelationships, users, type Property, type Unit, type NewProperty, type NewUnit } from '@/db';
import { generateId, now } from '@/lib/utils';

// Properties

export async function createProperty(data: {
  organizationId: string;
  landlordId?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: Property['propertyType'];
  description?: string;
  yearBuilt?: number;
}): Promise<Property> {
  const db = getDb();
  const id = generateId();
  const timestamp = now();

  const property: NewProperty = {
    id,
    organizationId: data.organizationId,
    landlordId: data.landlordId || null,
    name: data.name,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    country: 'US',
    propertyType: data.propertyType,
    description: data.description || null,
    yearBuilt: data.yearBuilt || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(properties).values(property);
  return property as Property;
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  const db = getDb();
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result[0];
}

export type PropertyWithUnitCount = Property & { unitCount: number };

export async function getPropertiesByOrganization(organizationId: string): Promise<PropertyWithUnitCount[]> {
  const db = getDb();

  const unitCountSubquery = db
    .select({
      propertyId: units.propertyId,
      count: count().as('count'),
    })
    .from(units)
    .groupBy(units.propertyId)
    .as('unit_counts');

  const result = await db
    .select({
      property: properties,
      unitCount: sql<number>`COALESCE(${unitCountSubquery.count}, 0)`.as('unitCount'),
    })
    .from(properties)
    .leftJoin(unitCountSubquery, eq(properties.id, unitCountSubquery.propertyId))
    .where(eq(properties.organizationId, organizationId))
    .orderBy(desc(properties.createdAt));

  return result.map(r => ({
    ...r.property,
    unitCount: Number(r.unitCount) || 0,
  }));
}

export async function getPropertiesByLandlord(landlordId: string): Promise<Property[]> {
  const db = getDb();
  return db
    .select()
    .from(properties)
    .where(eq(properties.landlordId, landlordId))
    .orderBy(desc(properties.createdAt));
}

export async function updateProperty(id: string, data: Partial<Pick<Property, 'name' | 'address' | 'city' | 'state' | 'zip' | 'propertyType' | 'description' | 'latitude' | 'longitude'>>) {
  const db = getDb();
  await db
    .update(properties)
    .set({ ...data, updatedAt: now() })
    .where(eq(properties.id, id));
}

export async function deleteProperty(id: string) {
  const db = getDb();
  await db.delete(properties).where(eq(properties.id, id));
}

// Units

export async function createUnit(data: {
  propertyId: string;
  unitNumber?: string;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  rentAmount: number;
  depositAmount?: number;
  status?: Unit['status'];
  availableDate?: Date;
  features?: string[];
  description?: string;
}): Promise<Unit> {
  const db = getDb();
  const id = generateId();
  const timestamp = now();

  const unit: NewUnit = {
    id,
    propertyId: data.propertyId,
    unitNumber: data.unitNumber || null,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    sqft: data.sqft || null,
    rentAmount: data.rentAmount,
    depositAmount: data.depositAmount || null,
    status: data.status || 'unlisted',
    availableDate: data.availableDate || null,
    features: data.features || null,
    description: data.description || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(units).values(unit);
  return unit as Unit;
}

export async function getUnitById(id: string): Promise<Unit | undefined> {
  const db = getDb();
  const result = await db.select().from(units).where(eq(units.id, id)).limit(1);
  return result[0];
}

export async function getUnitsByProperty(propertyId: string): Promise<Unit[]> {
  const db = getDb();
  return db
    .select()
    .from(units)
    .where(eq(units.propertyId, propertyId))
    .orderBy(units.unitNumber);
}

export async function getAvailableUnits(organizationId: string): Promise<(Unit & { property: Property })[]> {
  const db = getDb();
  const result = await db
    .select({
      unit: units,
      property: properties,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        eq(units.status, 'available')
      )
    )
    .orderBy(desc(units.createdAt));

  return result.map(r => ({ ...r.unit, property: r.property }));
}

export type UnitWithProperty = Unit & {
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
};

export async function getUnitsByOrganization(organizationId: string): Promise<UnitWithProperty[]> {
  const db = getDb();
  const result = await db
    .select({
      unit: units,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      propertyState: properties.state,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.organizationId, organizationId))
    .orderBy(properties.name, units.unitNumber);

  return result.map(r => ({
    ...r.unit,
    propertyName: r.propertyName,
    propertyAddress: r.propertyAddress,
    propertyCity: r.propertyCity,
    propertyState: r.propertyState,
  }));
}

export async function getUnitsForManager(userId: string, organizationId: string): Promise<UnitWithProperty[]> {
  const db = getDb();
  const result = await db
    .select({
      unit: units,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      propertyState: properties.state,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .innerJoin(propertyManagers, eq(properties.id, propertyManagers.propertyId))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        eq(propertyManagers.userId, userId),
        eq(propertyManagers.status, 'accepted')
      )
    )
    .orderBy(properties.name, units.unitNumber);

  return result.map(r => ({
    ...r.unit,
    propertyName: r.propertyName,
    propertyAddress: r.propertyAddress,
    propertyCity: r.propertyCity,
    propertyState: r.propertyState,
  }));
}

/**
 * Get units for a PM filtered by client (landlord they work with)
 */
export async function getUnitsForPmByClient(
  pmUserId: string,
  clientId: string
): Promise<UnitWithProperty[]> {
  const db = getDb();

  // Get the client relationship to find the landlordUserId
  const clientRelation = await db
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

  if (!clientRelation[0]) {
    return [];
  }

  const { landlordUserId, organizationId } = clientRelation[0];

  // Build the filter: either by landlordId or by organizationId for external clients
  const result = await db
    .select({
      unit: units,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      propertyState: properties.state,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      landlordUserId
        ? eq(properties.landlordId, landlordUserId)
        : organizationId
          ? eq(properties.organizationId, organizationId)
          : sql`1=0` // No matches if no landlord or org
    )
    .orderBy(properties.name, units.unitNumber);

  return result.map(r => ({
    ...r.unit,
    propertyName: r.propertyName,
    propertyAddress: r.propertyAddress,
    propertyCity: r.propertyCity,
    propertyState: r.propertyState,
  }));
}

/**
 * Get all units for a PM across all their clients
 */
export async function getAllUnitsForPm(pmUserId: string): Promise<UnitWithProperty[]> {
  const db = getDb();

  // Get all active client relationships for this PM
  const clientRelations = await db
    .select()
    .from(pmClientRelationships)
    .where(
      and(
        eq(pmClientRelationships.pmUserId, pmUserId),
        eq(pmClientRelationships.status, 'active')
      )
    );

  if (clientRelations.length === 0) {
    return [];
  }

  // Collect landlord IDs and org IDs from relationships
  const landlordIds = clientRelations
    .map(r => r.landlordUserId)
    .filter((id): id is string => id !== null);

  const orgIds = clientRelations
    .filter(r => !r.landlordUserId && r.organizationId)
    .map(r => r.organizationId)
    .filter((id): id is string => id !== null);

  // Build OR conditions
  const conditions = [];
  if (landlordIds.length > 0) {
    conditions.push(inArray(properties.landlordId, landlordIds));
  }
  if (orgIds.length > 0) {
    conditions.push(inArray(properties.organizationId, orgIds));
  }

  if (conditions.length === 0) {
    return [];
  }

  const result = await db
    .select({
      unit: units,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      propertyState: properties.state,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(or(...conditions))
    .orderBy(properties.name, units.unitNumber);

  return result.map(r => ({
    ...r.unit,
    propertyName: r.propertyName,
    propertyAddress: r.propertyAddress,
    propertyCity: r.propertyCity,
    propertyState: r.propertyState,
  }));
}

export async function updateUnit(id: string, data: Partial<Pick<Unit, 'unitNumber' | 'bedrooms' | 'bathrooms' | 'sqft' | 'rentAmount' | 'depositAmount' | 'status' | 'availableDate' | 'features' | 'description'>>) {
  const db = getDb();
  await db
    .update(units)
    .set({ ...data, updatedAt: now() })
    .where(eq(units.id, id));
}

export async function deleteUnit(id: string) {
  const db = getDb();
  await db.delete(units).where(eq(units.id, id));
}

// Property Managers

/**
 * Get properties assigned to a specific property manager (with accepted status)
 */
export async function getPropertiesForManager(userId: string, organizationId: string): Promise<PropertyWithUnitCount[]> {
  const db = getDb();

  const unitCountSubquery = db
    .select({
      propertyId: units.propertyId,
      count: count().as('count'),
    })
    .from(units)
    .groupBy(units.propertyId)
    .as('unit_counts');

  const result = await db
    .select({
      property: properties,
      unitCount: sql<number>`COALESCE(${unitCountSubquery.count}, 0)`.as('unitCount'),
    })
    .from(properties)
    .innerJoin(propertyManagers, eq(properties.id, propertyManagers.propertyId))
    .leftJoin(unitCountSubquery, eq(properties.id, unitCountSubquery.propertyId))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        eq(propertyManagers.userId, userId),
        eq(propertyManagers.status, 'accepted')
      )
    )
    .orderBy(desc(properties.createdAt));

  return result.map(r => ({
    ...r.property,
    unitCount: Number(r.unitCount) || 0,
  }));
}

/**
 * Get pending PM assignments for a user (to show in dashboard)
 */
export async function getPendingAssignmentsForManager(userId: string) {
  const db = getDb();
  return db
    .select({
      assignment: propertyManagers,
      property: properties,
    })
    .from(propertyManagers)
    .innerJoin(properties, eq(propertyManagers.propertyId, properties.id))
    .where(
      and(
        eq(propertyManagers.userId, userId),
        eq(propertyManagers.status, 'proposed')
      )
    )
    .orderBy(desc(propertyManagers.createdAt));
}

export async function getPendingAssignmentCount(userId: string): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ count: count() })
    .from(propertyManagers)
    .where(
      and(
        eq(propertyManagers.userId, userId),
        eq(propertyManagers.status, 'proposed')
      )
    );
  return result[0]?.count ?? 0;
}

export async function assignPropertyManager(data: {
  propertyId: string;
  userId: string;
  splitPercentage: number;
  proposedBy: string;
}) {
  const db = getDb();
  const id = generateId();

  await db.insert(propertyManagers).values({
    id,
    propertyId: data.propertyId,
    userId: data.userId,
    splitPercentage: data.splitPercentage,
    status: 'proposed',
    proposedBy: data.proposedBy,
    createdAt: now(),
  });

  return { id, ...data, status: 'proposed' as const };
}

export async function acceptPropertyManagerAgreement(id: string) {
  const db = getDb();
  await db
    .update(propertyManagers)
    .set({ status: 'accepted', acceptedAt: now() })
    .where(eq(propertyManagers.id, id));
}

export async function rejectPropertyManagerAgreement(id: string) {
  const db = getDb();
  await db
    .update(propertyManagers)
    .set({ status: 'rejected' })
    .where(eq(propertyManagers.id, id));
}

export async function getPropertyManagers(propertyId: string) {
  const db = getDb();
  return db
    .select()
    .from(propertyManagers)
    .where(eq(propertyManagers.propertyId, propertyId));
}

export async function getPropertyManagerAssignment(assignmentId: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(propertyManagers)
    .where(eq(propertyManagers.id, assignmentId))
    .limit(1);
  return result[0] || null;
}

export async function getPropertyManagersWithUsers(propertyId: string) {
  const db = getDb();
  return db
    .select({
      assignment: propertyManagers,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(propertyManagers)
    .innerJoin(users, eq(propertyManagers.userId, users.id))
    .where(eq(propertyManagers.propertyId, propertyId))
    .orderBy(desc(propertyManagers.createdAt));
}

// Unit Photos

export async function addUnitPhoto(data: {
  unitId: string;
  url: string;
  caption?: string;
  sortOrder?: number;
}) {
  const db = getDb();
  const id = generateId();

  await db.insert(unitPhotos).values({
    id,
    unitId: data.unitId,
    url: data.url,
    caption: data.caption || null,
    sortOrder: data.sortOrder || 0,
    createdAt: now(),
  });

  return { id, ...data };
}

export async function getUnitPhotos(unitId: string) {
  const db = getDb();
  return db
    .select()
    .from(unitPhotos)
    .where(eq(unitPhotos.unitId, unitId))
    .orderBy(unitPhotos.sortOrder);
}

export async function deleteUnitPhoto(id: string) {
  const db = getDb();
  await db.delete(unitPhotos).where(eq(unitPhotos.id, id));
}
