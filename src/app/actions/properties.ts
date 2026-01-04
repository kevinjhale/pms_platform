'use server';

import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createProperty,
  updateProperty,
  deleteProperty,
  createUnit,
  updateUnit,
  deleteUnit,
} from '@/services/properties';
import { dollarsToCents } from '@/lib/utils';

export async function createPropertyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    throw new Error('No organization selected');
  }

  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zip = formData.get('zip') as string;
  const propertyType = formData.get('propertyType') as string;
  const description = formData.get('description') as string;
  const yearBuilt = formData.get('yearBuilt') as string;

  if (!name || !address || !city || !state || !zip || !propertyType) {
    throw new Error('Missing required fields');
  }

  const property = await createProperty({
    organizationId: organization.id,
    landlordId: session.user.id,
    name,
    address,
    city,
    state,
    zip,
    propertyType: propertyType as 'single_family' | 'multi_family' | 'condo' | 'apartment' | 'townhouse' | 'other',
    description: description || undefined,
    yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
  });

  revalidatePath('/landlord/properties');
  redirect(`/landlord/properties/${property.id}`);
}

export async function updatePropertyAction(propertyId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zip = formData.get('zip') as string;
  const propertyType = formData.get('propertyType') as string;
  const description = formData.get('description') as string;

  await updateProperty(propertyId, {
    name,
    address,
    city,
    state,
    zip,
    propertyType: propertyType as 'single_family' | 'multi_family' | 'condo' | 'apartment' | 'townhouse' | 'other',
    description,
  });

  revalidatePath(`/landlord/properties/${propertyId}`);
  revalidatePath('/landlord/properties');
}

export async function deletePropertyAction(propertyId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  await deleteProperty(propertyId);

  revalidatePath('/landlord/properties');
  redirect('/landlord/properties');
}

// Unit actions

export async function createUnitAction(propertyId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const unitNumber = formData.get('unitNumber') as string;
  const bedrooms = parseInt(formData.get('bedrooms') as string);
  const bathrooms = parseFloat(formData.get('bathrooms') as string);
  const sqft = formData.get('sqft') as string;
  const rentAmount = formData.get('rentAmount') as string;
  const depositAmount = formData.get('depositAmount') as string;
  const status = formData.get('status') as string;
  const description = formData.get('description') as string;
  const features = formData.get('features') as string;

  if (isNaN(bedrooms) || isNaN(bathrooms) || !rentAmount) {
    throw new Error('Missing required fields');
  }

  await createUnit({
    propertyId,
    unitNumber: unitNumber || undefined,
    bedrooms,
    bathrooms,
    sqft: sqft ? parseInt(sqft) : undefined,
    rentAmount: dollarsToCents(parseFloat(rentAmount)),
    depositAmount: depositAmount ? dollarsToCents(parseFloat(depositAmount)) : undefined,
    status: (status as 'available' | 'occupied' | 'maintenance' | 'unlisted') || 'unlisted',
    description: description || undefined,
    features: features ? features.split(',').map(f => f.trim()).filter(Boolean) : undefined,
  });

  revalidatePath(`/landlord/properties/${propertyId}`);
}

export async function updateUnitAction(unitId: string, propertyId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const unitNumber = formData.get('unitNumber') as string;
  const bedrooms = parseInt(formData.get('bedrooms') as string);
  const bathrooms = parseFloat(formData.get('bathrooms') as string);
  const sqft = formData.get('sqft') as string;
  const rentAmount = formData.get('rentAmount') as string;
  const depositAmount = formData.get('depositAmount') as string;
  const status = formData.get('status') as string;
  const description = formData.get('description') as string;
  const features = formData.get('features') as string;

  await updateUnit(unitId, {
    unitNumber: unitNumber || undefined,
    bedrooms,
    bathrooms,
    sqft: sqft ? parseInt(sqft) : undefined,
    rentAmount: dollarsToCents(parseFloat(rentAmount)),
    depositAmount: depositAmount ? dollarsToCents(parseFloat(depositAmount)) : undefined,
    status: status as 'available' | 'occupied' | 'maintenance' | 'unlisted',
    description: description || undefined,
    features: features ? features.split(',').map(f => f.trim()).filter(Boolean) : undefined,
  });

  revalidatePath(`/landlord/properties/${propertyId}`);
}

export async function deleteUnitAction(unitId: string, propertyId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  await deleteUnit(unitId);

  revalidatePath(`/landlord/properties/${propertyId}`);
}
