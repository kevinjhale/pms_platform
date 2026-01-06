'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { updateUserRole, updateUserDefaultPage, type LandlordPage } from '@/services/users';

const VALID_LANDLORD_PAGES: LandlordPage[] = ['dashboard', 'properties', 'listings', 'applications', 'leases', 'maintenance', 'reports', 'activity', 'screening', 'settings'];

export async function selectRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const role = formData.get('role') as 'renter' | 'landlord' | 'manager' | 'maintenance';
  if (!role || !['renter', 'landlord', 'manager', 'maintenance'].includes(role)) {
    throw new Error('Invalid role selection');
  }

  await updateUserRole(session.user.id, role);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function updateDefaultPageAction(page: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!VALID_LANDLORD_PAGES.includes(page as LandlordPage)) {
    return { success: false, error: 'Invalid page selection' };
  }

  await updateUserDefaultPage(session.user.id, page as LandlordPage);

  revalidatePath('/landlord/settings');
  return { success: true };
}
