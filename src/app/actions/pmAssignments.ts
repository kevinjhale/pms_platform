'use server';

import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { revalidatePath } from 'next/cache';
import { assignPropertyManager } from '@/services/properties';

export async function assignPropertyManagerAction(
  propertyId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  const { role } = await getOrgContext();

  // Only owners and admins can assign PMs
  if (role !== 'owner' && role !== 'admin') {
    return { success: false, error: 'Only owners and admins can assign property managers' };
  }

  const userId = formData.get('userId') as string;
  const splitPercentageStr = formData.get('splitPercentage') as string;
  const splitPercentage = parseInt(splitPercentageStr, 10);

  if (!userId) {
    return { success: false, error: 'Please select a manager' };
  }

  if (isNaN(splitPercentage)) {
    return { success: false, error: 'Please enter a valid split percentage' };
  }

  if (splitPercentage < 0 || splitPercentage > 100) {
    return { success: false, error: 'Split percentage must be between 0 and 100' };
  }

  try {
    await assignPropertyManager({
      propertyId,
      userId,
      splitPercentage,
      proposedBy: session.user.id,
    });

    revalidatePath(`/landlord/properties/${propertyId}`);
    revalidatePath('/landlord/assignments');

    return { success: true };
  } catch (error) {
    console.error('Failed to assign PM:', error);
    return { success: false, error: 'Failed to create assignment' };
  }
}
