import { cookies } from 'next/headers';
import { auth } from './auth';
import { getUserOrganizations, getOrganizationById } from '@/services/organizations';
import type { Organization } from '@/db';

const ORG_COOKIE_NAME = 'pms_current_org';

export type OrgContext = {
  organization: Organization | null;
  organizations: Array<{ organization: Organization; role: string }>;
  role: string | null;
};

/**
 * Get the current organization context for the authenticated user
 */
export async function getOrgContext(): Promise<OrgContext> {
  const session = await auth();

  if (!session?.user?.id) {
    return { organization: null, organizations: [], role: null };
  }

  // Get all organizations the user belongs to
  const memberships = await getUserOrganizations(session.user.id);

  if (memberships.length === 0) {
    return { organization: null, organizations: memberships, role: null };
  }

  // Check for saved org preference in cookie
  const cookieStore = await cookies();
  const savedOrgId = cookieStore.get(ORG_COOKIE_NAME)?.value;

  // Try to use saved org, or default to first one
  let currentOrg: Organization | null = null;
  let currentRole: string | null = null;

  if (savedOrgId) {
    const membership = memberships.find(m => m.organization.id === savedOrgId);
    if (membership) {
      currentOrg = membership.organization;
      currentRole = membership.role;
    }
  }

  // Default to first organization if no valid saved org
  if (!currentOrg && memberships.length > 0) {
    currentOrg = memberships[0].organization;
    currentRole = memberships[0].role;
  }

  return {
    organization: currentOrg,
    organizations: memberships,
    role: currentRole,
  };
}

/**
 * Set the current organization (server action)
 */
export async function setCurrentOrganization(orgId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  // Verify user has access to this org
  const memberships = await getUserOrganizations(session.user.id);
  const hasAccess = memberships.some(m => m.organization.id === orgId);

  if (!hasAccess) return false;

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE_NAME, orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return true;
}

/**
 * Get the current organization ID from cookie (for middleware use)
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ORG_COOKIE_NAME)?.value || null;
}
