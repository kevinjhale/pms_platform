'use server';

import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { revalidatePath } from 'next/cache';
import {
  createUnitTemplate,
  createTemplateFromUnit,
  updateUnitTemplate,
  deleteUnitTemplate,
} from '@/services/unitTemplates';
import { dollarsToCents } from '@/lib/utils';

export async function createTemplateAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    throw new Error('No organization selected');
  }

  const name = formData.get('name') as string;
  const bedrooms = parseInt(formData.get('bedrooms') as string);
  const bathrooms = parseFloat(formData.get('bathrooms') as string);
  const sqft = formData.get('sqft') as string;
  const rentAmount = formData.get('rentAmount') as string;
  const depositAmount = formData.get('depositAmount') as string;
  const description = formData.get('description') as string;
  const features = formData.get('features') as string;

  if (!name || isNaN(bedrooms) || isNaN(bathrooms) || !rentAmount) {
    throw new Error('Missing required fields');
  }

  await createUnitTemplate({
    organizationId: organization.id,
    name,
    bedrooms,
    bathrooms,
    sqft: sqft ? parseInt(sqft) : undefined,
    rentAmount: dollarsToCents(parseFloat(rentAmount)),
    depositAmount: depositAmount ? dollarsToCents(parseFloat(depositAmount)) : undefined,
    description: description || undefined,
    features: features ? features.split(',').map(f => f.trim()).filter(Boolean) : undefined,
  });

  revalidatePath('/landlord/settings/templates');
}

export async function saveUnitAsTemplateAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    throw new Error('No organization selected');
  }

  const unitId = formData.get('unitId') as string;
  const templateName = formData.get('templateName') as string;

  if (!unitId || !templateName) {
    throw new Error('Missing required fields');
  }

  await createTemplateFromUnit(unitId, organization.id, templateName);

  revalidatePath('/landlord/settings/templates');
}

export async function updateTemplateAction(templateId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const name = formData.get('name') as string;
  const bedrooms = parseInt(formData.get('bedrooms') as string);
  const bathrooms = parseFloat(formData.get('bathrooms') as string);
  const sqft = formData.get('sqft') as string;
  const rentAmount = formData.get('rentAmount') as string;
  const depositAmount = formData.get('depositAmount') as string;
  const description = formData.get('description') as string;
  const features = formData.get('features') as string;

  await updateUnitTemplate(templateId, {
    name,
    bedrooms,
    bathrooms,
    sqft: sqft ? parseInt(sqft) : null,
    rentAmount: dollarsToCents(parseFloat(rentAmount)),
    depositAmount: depositAmount ? dollarsToCents(parseFloat(depositAmount)) : null,
    description: description || null,
    features: features ? features.split(',').map(f => f.trim()).filter(Boolean) : null,
  });

  revalidatePath('/landlord/settings/templates');
}

export async function deleteTemplateAction(templateId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  await deleteUnitTemplate(templateId);

  revalidatePath('/landlord/settings/templates');
}
