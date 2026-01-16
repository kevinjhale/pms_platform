import { cookies } from 'next/headers';
import { auth } from './auth';
import { getUserRoles, updateUserRole } from '@/services/users';
import type { PlatformRole } from '@/db';

const ROLE_COOKIE_NAME = 'pms_active_role';

export type RoleContext = {
  activeRole: PlatformRole | null;
  availableRoles: PlatformRole[];
};

/**
 * Get the current role context for the authenticated user
 */
export async function getRoleContext(): Promise<RoleContext> {
  const session = await auth();

  if (!session?.user?.id) {
    return { activeRole: null, availableRoles: [] };
  }

  // Get all roles the user has
  const roles = await getUserRoles(session.user.id);

  if (roles.length === 0) {
    // Fall back to the legacy single role if no junction table entries
    const legacyRole = session.user.role as PlatformRole | null;
    return {
      activeRole: legacyRole,
      availableRoles: legacyRole ? [legacyRole] : [],
    };
  }

  // Check for saved role preference in cookie
  const cookieStore = await cookies();
  const savedRole = cookieStore.get(ROLE_COOKIE_NAME)?.value as PlatformRole | undefined;

  // Try to use saved role, or default to first one
  let activeRole: PlatformRole | null = null;

  if (savedRole && roles.includes(savedRole)) {
    activeRole = savedRole;
  } else if (roles.length > 0) {
    // Default to first role (or the one stored in users.role)
    const dbRole = session.user.role as PlatformRole | null;
    activeRole = dbRole && roles.includes(dbRole) ? dbRole : roles[0];
  }

  return {
    activeRole,
    availableRoles: roles,
  };
}

/**
 * Set the active role (server action)
 */
export async function setActiveRole(role: PlatformRole): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  // Verify user has this role
  const roles = await getUserRoles(session.user.id);

  // Also check legacy role for backward compatibility
  const hasRole = roles.includes(role) || session.user.role === role;
  if (!hasRole) return false;

  // Update users.role in database (active role)
  await updateUserRole(session.user.id, role);

  // Set cookie for fast middleware access
  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE_NAME, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return true;
}

/**
 * Get the active role from cookie (for middleware use)
 */
export async function getActiveRoleFromCookie(): Promise<PlatformRole | null> {
  const cookieStore = await cookies();
  return (cookieStore.get(ROLE_COOKIE_NAME)?.value as PlatformRole) || null;
}

/**
 * Clear the active role cookie (for logout)
 */
export async function clearActiveRoleCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ROLE_COOKIE_NAME);
}
