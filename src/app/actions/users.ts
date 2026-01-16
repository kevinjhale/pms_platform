'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { updateUserRole, updateUserDefaultPage, setUserRoles, getUserRoles, type LandlordPage } from '@/services/users';
import { setActiveRole } from '@/lib/role-context';
import type { PlatformRole } from '@/db';

const VALID_ROLES: PlatformRole[] = ['renter', 'landlord', 'manager', 'maintenance'];
const VALID_LANDLORD_PAGES: LandlordPage[] = ['dashboard', 'properties', 'listings', 'applications', 'leases', 'maintenance', 'reports', 'activity', 'screening', 'settings'];

/**
 * Legacy single-role selection (kept for backward compatibility)
 */
export async function selectRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const role = formData.get('role') as PlatformRole;
  if (!role || !VALID_ROLES.includes(role)) {
    throw new Error('Invalid role selection');
  }

  // Set both the single role and add to roles table
  await setUserRoles(session.user.id, [role]);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

/**
 * Multi-role selection (for users selecting multiple roles)
 */
export async function selectRolesAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  // Get all selected roles from checkboxes
  const selectedRoles = formData.getAll('roles') as PlatformRole[];

  // Validate roles
  const validRoles = selectedRoles.filter(role => VALID_ROLES.includes(role));
  if (validRoles.length === 0) {
    throw new Error('Please select at least one role');
  }

  // Set roles in junction table and first role as active
  await setUserRoles(session.user.id, validRoles);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

/**
 * Switch active role for users with multiple roles
 */
export async function switchRoleAction(role: PlatformRole): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!VALID_ROLES.includes(role)) {
    return { success: false, error: 'Invalid role' };
  }

  // Verify user has this role
  const userRoles = await getUserRoles(session.user.id);
  const hasRole = userRoles.includes(role) || session.user.role === role;

  if (!hasRole) {
    return { success: false, error: 'You do not have this role' };
  }

  // Set the active role (updates cookie and database)
  const success = await setActiveRole(role);
  if (!success) {
    return { success: false, error: 'Failed to switch role' };
  }

  // Determine redirect based on new role
  let redirectTo = '/dashboard';
  if (role === 'renter') redirectTo = '/renter';
  else if (role === 'landlord' || role === 'manager') redirectTo = '/landlord';
  else if (role === 'maintenance') redirectTo = '/maintenance';

  revalidatePath('/');

  return { success: true, redirectTo };
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
