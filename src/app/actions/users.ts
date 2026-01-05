'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { updateUserRole } from '@/services/users';

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
