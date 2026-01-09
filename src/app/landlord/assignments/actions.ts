'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { acceptPropertyManagerAgreement, rejectPropertyManagerAgreement } from '@/services/properties';

export async function respondToAssignment(assignmentId: string, accept: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    if (accept) {
      await acceptPropertyManagerAgreement(assignmentId);
    } else {
      await rejectPropertyManagerAgreement(assignmentId);
    }

    revalidatePath('/landlord/assignments');
    revalidatePath('/landlord/properties');

    return { success: true };
  } catch (error) {
    console.error('Failed to respond to assignment:', error);
    return { success: false, error: 'Failed to process response' };
  }
}
