import { eq, and, desc } from 'drizzle-orm';
import { getDb, properties, units, propertyManagers, unitPhotos, type Property, type Unit, type NewProperty, type NewUnit } from '@/db';
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

export async function getPropertiesByOrganization(organizationId: string): Promise<Property[]> {
  const db = getDb();
  return db
    .select()
    .from(properties)
    .where(eq(properties.organizationId, organizationId))
    .orderBy(desc(properties.createdAt));
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

export async function getUnitsByOrganization(organizationId: string): Promise<(Unit & { propertyName: string })[]> {
  const db = getDb();
  const result = await db
    .select({
      unit: units,
      propertyName: properties.name,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.organizationId, organizationId))
    .orderBy(properties.name, units.unitNumber);

  return result.map(r => ({ ...r.unit, propertyName: r.propertyName }));
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
