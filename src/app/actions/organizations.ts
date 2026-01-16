'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createOrganization,
  addOrganizationMember,
  getUserOrganizations,
  getOrganizationBySlug,
  getUserRoleInOrganization,
  getOrganizationMembers,
  updateOrganizationMemberRole,
  removeOrganizationMember,
} from '@/services/organizations';
import { getOrgContext } from '@/lib/org-context';
import { setCurrentOrganization } from '@/lib/org-context';
import { slugify } from '@/lib/utils';

export async function createOrganizationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const name = formData.get('name') as string;
  if (!name || name.length < 2) {
    throw new Error('Organization name must be at least 2 characters');
  }

  // Generate slug and check uniqueness
  let slug = slugify(name);
  const existing = await getOrganizationBySlug(slug);
  if (existing) {
    // Add random suffix if slug exists
    slug = `${slug}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const org = await createOrganization({
    name,
    slug,
    ownerId: session.user.id,
  });

  // Set as current org
  await setCurrentOrganization(org.id);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function switchOrganizationAction(orgId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const success = await setCurrentOrganization(orgId);
  if (!success) {
    throw new Error('You do not have access to this organization');
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function inviteMemberAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const organizationId = formData.get('organizationId') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as 'admin' | 'manager' | 'staff';

  if (!organizationId || !email || !role) {
    throw new Error('Missing required fields');
  }

  // TODO: Verify current user has permission to invite
  // TODO: Create invitation record and send email
  // For now, this is a placeholder

  revalidatePath('/admin/settings/team');
}

type OrgRole = 'owner' | 'admin' | 'manager' | 'staff';

/**
 * Update a member's role in the current organization
 */
export async function updateMemberRoleAction(
  targetUserId: string,
  newRole: 'admin' | 'manager' | 'staff'
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    return { success: false, error: 'No organization selected' };
  }

  // Check caller's role
  const callerRole = await getUserRoleInOrganization(session.user.id, organization.id);
  if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
    return { success: false, error: 'You do not have permission to change member roles' };
  }

  // Get target's current role
  const targetRole = await getUserRoleInOrganization(targetUserId, organization.id);
  if (!targetRole) {
    return { success: false, error: 'Member not found in organization' };
  }

  // Cannot change owner's role
  if (targetRole === 'owner') {
    return { success: false, error: 'Cannot change the owner\'s role' };
  }

  // Admins cannot promote to admin (only owners can)
  if (callerRole === 'admin' && newRole === 'admin') {
    return { success: false, error: 'Only owners can promote members to admin' };
  }

  // Admins cannot change other admins' roles
  if (callerRole === 'admin' && targetRole === 'admin') {
    return { success: false, error: 'Admins cannot change other admins\' roles' };
  }

  await updateOrganizationMemberRole(organization.id, targetUserId, newRole);

  revalidatePath('/landlord/settings');
  return { success: true };
}

/**
 * Remove a member from the current organization
 */
export async function removeMemberAction(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    return { success: false, error: 'No organization selected' };
  }

  // Cannot remove yourself
  if (targetUserId === session.user.id) {
    return { success: false, error: 'You cannot remove yourself from the organization' };
  }

  // Check caller's role
  const callerRole = await getUserRoleInOrganization(session.user.id, organization.id);
  if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
    return { success: false, error: 'You do not have permission to remove members' };
  }

  // Get target's role
  const targetRole = await getUserRoleInOrganization(targetUserId, organization.id);
  if (!targetRole) {
    return { success: false, error: 'Member not found in organization' };
  }

  // Cannot remove owner
  if (targetRole === 'owner') {
    return { success: false, error: 'Cannot remove the organization owner' };
  }

  // Admins cannot remove other admins
  if (callerRole === 'admin' && targetRole === 'admin') {
    return { success: false, error: 'Admins cannot remove other admins' };
  }

  await removeOrganizationMember(organization.id, targetUserId);

  revalidatePath('/landlord/settings');
  return { success: true };
}
