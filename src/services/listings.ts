import { getDb, units, properties } from "@/db";
import { eq, like, or, and, desc, sql } from "drizzle-orm";
import { centsToDollars } from "@/lib/utils";

export type PublicListing = {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  price: number; // dollars
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  description: string | null;
  availableDate: Date | null;
  features: string[] | null;
  propertyType: string;
};

export async function getPublicListings(options?: {
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<{ listings: PublicListing[]; total: number }> {
  const db = getDb();
  const { query, limit = 20, offset = 0 } = options || {};

  // Build where conditions
  const searchTerm = query ? `%${query.toLowerCase()}%` : null;
  const whereCondition = searchTerm
    ? and(
        eq(units.status, "available"),
        or(
          like(sql`lower(${properties.name})`, searchTerm),
          like(sql`lower(${properties.address})`, searchTerm),
          like(sql`lower(${properties.city})`, searchTerm)
        )
      )
    : eq(units.status, "available");

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(whereCondition);

  const total = countResult[0]?.count || 0;

  // Get paginated results
  const results = await db
    .select({
      id: units.id,
      unitNumber: units.unitNumber,
      bedrooms: units.bedrooms,
      bathrooms: units.bathrooms,
      sqft: units.sqft,
      rentAmount: units.rentAmount,
      description: units.description,
      availableDate: units.availableDate,
      features: units.features,
      propertyName: properties.name,
      address: properties.address,
      city: properties.city,
      state: properties.state,
      propertyType: properties.propertyType,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(whereCondition)
    .orderBy(desc(units.createdAt))
    .limit(limit)
    .offset(offset);

  const listings: PublicListing[] = results.map((row) => ({
    id: row.id,
    title: row.unitNumber
      ? `${row.propertyName} - Unit ${row.unitNumber}`
      : row.propertyName,
    address: row.address,
    city: row.city,
    state: row.state,
    price: centsToDollars(row.rentAmount),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sqft: row.sqft,
    description: row.description,
    availableDate: row.availableDate,
    features: row.features,
    propertyType: row.propertyType,
  }));

  return { listings, total };
}

export type LandlordListing = PublicListing & {
  status: "available" | "occupied" | "maintenance" | "unlisted";
  propertyId: string;
};

export async function getListingsByOrganization(
  organizationId: string
): Promise<LandlordListing[]> {
  const db = getDb();

  const results = await db
    .select({
      id: units.id,
      unitNumber: units.unitNumber,
      bedrooms: units.bedrooms,
      bathrooms: units.bathrooms,
      sqft: units.sqft,
      rentAmount: units.rentAmount,
      description: units.description,
      availableDate: units.availableDate,
      features: units.features,
      status: units.status,
      propertyId: properties.id,
      propertyName: properties.name,
      address: properties.address,
      city: properties.city,
      state: properties.state,
      propertyType: properties.propertyType,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.organizationId, organizationId))
    .orderBy(desc(units.createdAt));

  return results.map((row) => ({
    id: row.id,
    title: row.unitNumber
      ? `${row.propertyName} - Unit ${row.unitNumber}`
      : row.propertyName,
    address: row.address,
    city: row.city,
    state: row.state,
    price: centsToDollars(row.rentAmount),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sqft: row.sqft,
    description: row.description,
    availableDate: row.availableDate,
    features: row.features,
    propertyType: row.propertyType,
    status: row.status,
    propertyId: row.propertyId,
  }));
}

export async function updateListingStatus(
  unitId: string,
  status: "available" | "occupied" | "maintenance" | "unlisted"
): Promise<void> {
  const db = getDb();
  await db.update(units).set({ status }).where(eq(units.id, unitId));
}

export async function getPublicListingById(
  id: string
): Promise<PublicListing | null> {
  const db = getDb();

  const results = await db
    .select({
      id: units.id,
      unitNumber: units.unitNumber,
      bedrooms: units.bedrooms,
      bathrooms: units.bathrooms,
      sqft: units.sqft,
      rentAmount: units.rentAmount,
      description: units.description,
      availableDate: units.availableDate,
      features: units.features,
      propertyName: properties.name,
      address: properties.address,
      city: properties.city,
      state: properties.state,
      propertyType: properties.propertyType,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(units.id, id))
    .limit(1);

  if (results.length === 0) return null;

  const row = results[0];
  return {
    id: row.id,
    title: row.unitNumber
      ? `${row.propertyName} - Unit ${row.unitNumber}`
      : row.propertyName,
    address: row.address,
    city: row.city,
    state: row.state,
    price: centsToDollars(row.rentAmount),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sqft: row.sqft,
    description: row.description,
    availableDate: row.availableDate,
    features: row.features,
    propertyType: row.propertyType,
  };
}
