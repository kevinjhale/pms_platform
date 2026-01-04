'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createOrganization,
  addOrganizationMember,
  getUserOrganizations,
  getOrganizationBySlug,
} from '@/services/organizations';
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
