import { eq, desc } from 'drizzle-orm';
import { getDb, unitTemplates, units, type UnitTemplate, type NewUnitTemplate } from '@/db';
import { generateId, now } from '@/lib/utils';

export async function createUnitTemplate(data: {
  organizationId: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  rentAmount: number;
  depositAmount?: number;
  features?: string[];
  description?: string;
}): Promise<UnitTemplate> {
  const db = getDb();
  const id = generateId();
  const timestamp = now();

  const template: NewUnitTemplate = {
    id,
    organizationId: data.organizationId,
    name: data.name,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    sqft: data.sqft || null,
    rentAmount: data.rentAmount,
    depositAmount: data.depositAmount || null,
    features: data.features || null,
    description: data.description || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(unitTemplates).values(template);
  return template as UnitTemplate;
}

export async function createTemplateFromUnit(
  unitId: string,
  organizationId: string,
  templateName: string
): Promise<UnitTemplate> {
  const db = getDb();

  const unit = await db.select().from(units).where(eq(units.id, unitId)).limit(1);
  if (!unit[0]) {
    throw new Error('Unit not found');
  }

  const u = unit[0];
  return createUnitTemplate({
    organizationId,
    name: templateName,
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms,
    sqft: u.sqft || undefined,
    rentAmount: u.rentAmount,
    depositAmount: u.depositAmount || undefined,
    features: u.features || undefined,
    description: u.description || undefined,
  });
}

export async function getTemplatesByOrganization(organizationId: string): Promise<UnitTemplate[]> {
  const db = getDb();
  return db
    .select()
    .from(unitTemplates)
    .where(eq(unitTemplates.organizationId, organizationId))
    .orderBy(desc(unitTemplates.createdAt));
}

export async function getTemplateById(id: string): Promise<UnitTemplate | undefined> {
  const db = getDb();
  const result = await db.select().from(unitTemplates).where(eq(unitTemplates.id, id)).limit(1);
  return result[0];
}

export async function updateUnitTemplate(
  id: string,
  data: Partial<Pick<UnitTemplate, 'name' | 'bedrooms' | 'bathrooms' | 'sqft' | 'rentAmount' | 'depositAmount' | 'features' | 'description'>>
): Promise<void> {
  const db = getDb();
  await db
    .update(unitTemplates)
    .set({ ...data, updatedAt: now() })
    .where(eq(unitTemplates.id, id));
}

export async function deleteUnitTemplate(id: string): Promise<void> {
  const db = getDb();
  await db.delete(unitTemplates).where(eq(unitTemplates.id, id));
}
