import { getDb, properties, units, type Property, type Unit } from '@/db';
import { generateId, now } from '@/lib/utils';

export interface PropertyGroup {
  propertyKey: string;
  propertyData: {
    name: string;
    propertyType: Property['propertyType'];
    address: string;
    city: string;
    state: string;
    zip: string;
    yearBuilt?: number;
    description?: string;
  };
  units: Array<{
    unitNumber?: string;
    bedrooms: number;
    bathrooms: number;
    sqft?: number;
    rentAmount: number;
    depositAmount?: number;
    status: Unit['status'];
    features?: string[];
    description?: string;
  }>;
}

export interface ImportResult {
  propertiesCreated: number;
  unitsCreated: number;
  propertiesFailed: number;
  errors: Array<{ propertyName: string; error: string }>;
}

export async function importPropertyGroup(
  group: PropertyGroup,
  organizationId: string,
  landlordId?: string,
  createdByUserId?: string
): Promise<{ success: boolean; propertyId?: string; unitsCreated?: number; error?: string }> {
  const db = getDb();
  const timestamp = now();

  try {
    const propertyId = generateId();
    await db.insert(properties).values({
      id: propertyId,
      organizationId,
      landlordId: landlordId || null,
      createdByUserId: createdByUserId || null,
      name: group.propertyData.name,
      address: group.propertyData.address,
      city: group.propertyData.city,
      state: group.propertyData.state,
      zip: group.propertyData.zip,
      country: 'US',
      propertyType: group.propertyData.propertyType,
      yearBuilt: group.propertyData.yearBuilt || null,
      description: group.propertyData.description || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    for (const unitData of group.units) {
      const unitId = generateId();
      await db.insert(units).values({
        id: unitId,
        propertyId,
        unitNumber: unitData.unitNumber || null,
        bedrooms: unitData.bedrooms,
        bathrooms: unitData.bathrooms,
        sqft: unitData.sqft || null,
        rentAmount: unitData.rentAmount,
        depositAmount: unitData.depositAmount || null,
        status: unitData.status,
        features: unitData.features || null,
        description: unitData.description || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    return { success: true, propertyId, unitsCreated: group.units.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function importAllProperties(
  groups: PropertyGroup[],
  organizationId: string,
  landlordId?: string,
  createdByUserId?: string
): Promise<ImportResult> {
  const result: ImportResult = {
    propertiesCreated: 0,
    unitsCreated: 0,
    propertiesFailed: 0,
    errors: [],
  };

  for (const group of groups) {
    const importResult = await importPropertyGroup(group, organizationId, landlordId, createdByUserId);

    if (importResult.success) {
      result.propertiesCreated++;
      result.unitsCreated += importResult.unitsCreated || 0;
    } else {
      result.propertiesFailed++;
      result.errors.push({
        propertyName: group.propertyData.name,
        error: importResult.error || 'Unknown error',
      });
    }
  }

  return result;
}
