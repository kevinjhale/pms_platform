'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { updateMaintenanceStatus, addMaintenanceComment, completeMaintenanceRequest } from '@/services/maintenance';
import { dollarsToCents } from '@/lib/utils';

export async function updateStatusAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const status = formData.get('status') as 'acknowledged' | 'in_progress' | 'pending_parts';
  if (!status || !['acknowledged', 'in_progress', 'pending_parts'].includes(status)) {
    throw new Error('Invalid status');
  }

  await updateMaintenanceStatus(id, status);
  revalidatePath(`/maintenance/${id}`);
  revalidatePath('/maintenance');
}

export async function addCommentAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const content = formData.get('content') as string;
  const isInternal = formData.get('isInternal') === 'true';

  if (!content || content.trim().length === 0) {
    throw new Error('Comment content is required');
  }

  await addMaintenanceComment(id, session.user.id, content.trim(), isInternal);
  revalidatePath(`/maintenance/${id}`);
}

export async function completeTicketAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const resolutionSummary = formData.get('resolutionSummary') as string;
  const actualCostStr = formData.get('actualCost') as string;

  if (!resolutionSummary || resolutionSummary.trim().length === 0) {
    throw new Error('Resolution summary is required');
  }

  const actualCost = actualCostStr ? dollarsToCents(parseFloat(actualCostStr)) : undefined;

  await completeMaintenanceRequest(id, session.user.id, resolutionSummary.trim(), actualCost);
  revalidatePath(`/maintenance/${id}`);
  revalidatePath('/maintenance');
}
