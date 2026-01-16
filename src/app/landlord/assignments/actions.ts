'use server';

import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { revalidatePath } from 'next/cache';
import {
  acceptPropertyManagerAgreement,
  rejectPropertyManagerAgreement,
  getPropertyManagerAssignment,
  getPropertyById,
} from '@/services/properties';
import { getUserById } from '@/services/users';
import { sendPMAssignmentResponseEmail } from '@/services/email';

export async function respondToAssignment(assignmentId: string, accept: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const { organization } = await getOrgContext();

  try {
    // Get assignment details before updating
    const assignment = await getPropertyManagerAssignment(assignmentId);

    if (accept) {
      await acceptPropertyManagerAgreement(assignmentId);
    } else {
      await rejectPropertyManagerAgreement(assignmentId);
    }

    // Send notification email to the landlord who proposed the assignment
    if (assignment) {
      const [property, proposer] = await Promise.all([
        getPropertyById(assignment.propertyId),
        getUserById(assignment.proposedBy),
      ]);

      if (property && proposer?.email) {
        const pmName = session.user.name || session.user.email || 'A property manager';
        await sendPMAssignmentResponseEmail({
          to: proposer.email,
          landlordName: proposer.name || proposer.email,
          pmName,
          propertyName: property.name,
          accepted: accept,
          organizationId: organization?.id,
        });
      }
    }

    revalidatePath('/landlord/assignments');
    revalidatePath('/landlord/properties');

    return { success: true };
  } catch (error) {
    console.error('Failed to respond to assignment:', error);
    return { success: false, error: 'Failed to process response' };
  }
}
