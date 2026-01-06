import { eq, and } from 'drizzle-orm';
import { getDb, organizations, organizationMembers, type Organization, type NewOrganization } from '@/db';
import { generateId, now, slugify } from '@/lib/utils';

export async function createOrganization(data: {
  name: string;
  ownerId: string;
  slug?: string;
}): Promise<Organization> {
  const db = getDb();
  const id = generateId();
  const timestamp = now();
  const slug = data.slug || slugify(data.name) + '-' + generateId(6);

  const org: NewOrganization = {
    id,
    name: data.name,
    slug,
    settings: {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(organizations).values(org);

  // Add owner as organization member
  await db.insert(organizationMembers).values({
    id: generateId(),
    organizationId: id,
    userId: data.ownerId,
    role: 'owner',
    createdAt: timestamp,
  });

  return org as Organization;
}

export async function getOrganizationById(id: string): Promise<Organization | undefined> {
  const db = getDb();
  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result[0];
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
  const db = getDb();
  const result = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return result[0];
}

export async function getUserOrganizations(userId: string) {
  const db = getDb();
  const memberships = await db
    .select({
      organization: organizations,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, userId));

  return memberships;
}

export async function getOrganizationMembers(organizationId: string) {
  const db = getDb();
  return db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, organizationId));
}

export async function getOrganizationMembersWithUsers(organizationId: string) {
  const db = getDb();
  const { users } = await import('@/db');

  return db
    .select({
      member: organizationMembers,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
      },
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(eq(organizationMembers.organizationId, organizationId));
}

export async function addOrganizationMember(data: {
  organizationId: string;
  userId: string;
  role: 'admin' | 'manager' | 'staff';
}) {
  const db = getDb();
  const id = generateId();

  await db.insert(organizationMembers).values({
    id,
    organizationId: data.organizationId,
    userId: data.userId,
    role: data.role,
    createdAt: now(),
  });

  return { id, ...data };
}

export async function updateOrganizationMemberRole(
  organizationId: string,
  userId: string,
  role: 'admin' | 'manager' | 'staff'
) {
  const db = getDb();
  await db
    .update(organizationMembers)
    .set({ role })
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      )
    );
}

export async function removeOrganizationMember(organizationId: string, userId: string) {
  const db = getDb();
  await db
    .delete(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      )
    );
}

export async function updateOrganization(id: string, data: Partial<Pick<Organization, 'name' | 'settings'>>) {
  const db = getDb();
  await db
    .update(organizations)
    .set({ ...data, updatedAt: now() })
    .where(eq(organizations.id, id));
}

export async function isUserInOrganization(userId: string, organizationId: string): Promise<boolean> {
  const db = getDb();
  const result = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);
  return result.length > 0;
}

export async function getUserRoleInOrganization(
  userId: string,
  organizationId: string
): Promise<string | null> {
  const db = getDb();
  const result = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);
  return result[0]?.role || null;
}
