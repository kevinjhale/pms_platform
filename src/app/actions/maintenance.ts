'use server';

import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createMaintenanceRequest,
  archiveMaintenanceRequest,
  unarchiveMaintenanceRequest,
  archiveCompletedRequestsOlderThan,
} from '@/services/maintenance';

export async function createMaintenanceRequestAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    throw new Error('No organization selected');
  }

  const unitId = formData.get('unitId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const priority = formData.get('priority') as string;
  const permissionToEnter = formData.get('permissionToEnter') === 'on';

  if (!unitId || !title || !description || !category || !priority) {
    throw new Error('Missing required fields');
  }

  await createMaintenanceRequest({
    unitId,
    requestedBy: session.user.id,
    title,
    description,
    category: category as 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest' | 'landscaping' | 'cleaning' | 'security' | 'other',
    priority: priority as 'low' | 'medium' | 'high' | 'emergency',
    permissionToEnter,
    status: 'open',
  });

  revalidatePath('/landlord/maintenance');
  redirect('/landlord/maintenance');
}

export async function archiveMaintenanceRequestAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  await archiveMaintenanceRequest(id);

  revalidatePath(`/landlord/maintenance/${id}`);
  revalidatePath('/landlord/maintenance');
}

export async function unarchiveMaintenanceRequestAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  await unarchiveMaintenanceRequest(id);

  revalidatePath(`/landlord/maintenance/${id}`);
  revalidatePath('/landlord/maintenance');
}

export async function archiveAllCompletedAction() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    throw new Error('No organization selected');
  }

  const count = await archiveCompletedRequestsOlderThan(organization.id, 7);

  revalidatePath('/landlord/maintenance');

  return { count };
}
