'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { getOrgContext } from '@/lib/org-context';
import { getUserRoleInOrganization } from '@/services/organizations';
import { createInvite, getPendingInvites, revokeInvite } from '@/services/invites';

type ActionResult = {
  success: boolean;
  error?: string;
};

async function requireOrgAdmin(): Promise<{
  userId: string;
  organizationId: string;
  role: string;
} | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    return null;
  }

  const role = await getUserRoleInOrganization(session.user.id, organization.id);
  if (!role || !['owner', 'admin'].includes(role)) {
    return null;
  }

  return {
    userId: session.user.id,
    organizationId: organization.id,
    role,
  };
}

export async function createInviteAction(formData: FormData): Promise<ActionResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { success: false, error: 'You do not have permission to invite members' };
  }

  const email = formData.get('email') as string;
  const role = formData.get('role') as 'admin' | 'manager' | 'staff';

  if (!email || !role) {
    return { success: false, error: 'Email and role are required' };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  if (!['admin', 'manager', 'staff'].includes(role)) {
    return { success: false, error: 'Invalid role selected' };
  }

  try {
    await createInvite({
      organizationId: context.organizationId,
      email,
      role,
      invitedBy: context.userId,
    });

    revalidatePath('/landlord/settings');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create invite';
    return { success: false, error: message };
  }
}

export async function revokeInviteAction(inviteId: string): Promise<ActionResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { success: false, error: 'You do not have permission to revoke invites' };
  }

  try {
    await revokeInvite(inviteId, context.organizationId);
    revalidatePath('/landlord/settings');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to revoke invite' };
  }
}

export async function getInvitesAction() {
  const context = await requireOrgAdmin();
  if (!context) {
    return [];
  }

  return getPendingInvites(context.organizationId);
}
