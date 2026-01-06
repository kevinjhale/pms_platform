import { eq, and, isNull, gt } from 'drizzle-orm';
import {
  getDb,
  organizationInvites,
  organizationMembers,
  organizations,
  users,
  type OrganizationInvite,
  type NewOrganizationInvite,
} from '@/db';
import { generateId, now } from '@/lib/utils';
import { sendInviteEmail } from './email';

const INVITE_EXPIRY_DAYS = 7;

export async function createInvite(data: {
  organizationId: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  invitedBy: string;
}): Promise<OrganizationInvite> {
  const db = getDb();
  const id = generateId();
  const token = generateId(32);
  const timestamp = now();
  const expiresAt = new Date(timestamp.getTime() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Check if there's already a pending invite for this email in this org
  const existingInvite = await db
    .select()
    .from(organizationInvites)
    .where(
      and(
        eq(organizationInvites.organizationId, data.organizationId),
        eq(organizationInvites.email, data.email.toLowerCase()),
        isNull(organizationInvites.acceptedAt),
        gt(organizationInvites.expiresAt, timestamp)
      )
    )
    .limit(1);

  if (existingInvite.length > 0) {
    throw new Error('An active invite already exists for this email');
  }

  // Check if user is already a member
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    const existingMember = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, data.organizationId),
          eq(organizationMembers.userId, existingUser[0].id)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      throw new Error('This user is already a member of the organization');
    }
  }

  const invite: NewOrganizationInvite = {
    id,
    organizationId: data.organizationId,
    email: data.email.toLowerCase(),
    role: data.role,
    invitedBy: data.invitedBy,
    token,
    expiresAt,
    createdAt: timestamp,
  };

  await db.insert(organizationInvites).values(invite);

  // Send invite email (non-blocking)
  (async () => {
    try {
      // Get organization name
      const org = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, data.organizationId))
        .limit(1);

      // Get inviter name
      const inviter = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, data.invitedBy))
        .limit(1);

      await sendInviteEmail({
        to: data.email,
        inviterName: inviter[0]?.name || 'A team member',
        organizationName: org[0]?.name || 'the organization',
        role: data.role,
        inviteToken: token,
      });
    } catch (error) {
      console.error('[Invites] Failed to send invite email:', error);
    }
  })();

  return invite as OrganizationInvite;
}

export async function getPendingInvites(organizationId: string): Promise<OrganizationInvite[]> {
  const db = getDb();
  const timestamp = now();

  return db
    .select()
    .from(organizationInvites)
    .where(
      and(
        eq(organizationInvites.organizationId, organizationId),
        isNull(organizationInvites.acceptedAt),
        gt(organizationInvites.expiresAt, timestamp)
      )
    );
}

export async function revokeInvite(inviteId: string, organizationId: string): Promise<void> {
  const db = getDb();

  await db
    .delete(organizationInvites)
    .where(
      and(
        eq(organizationInvites.id, inviteId),
        eq(organizationInvites.organizationId, organizationId)
      )
    );
}

export async function getInviteByToken(token: string): Promise<OrganizationInvite | null> {
  const db = getDb();
  const timestamp = now();

  const result = await db
    .select()
    .from(organizationInvites)
    .where(
      and(
        eq(organizationInvites.token, token),
        isNull(organizationInvites.acceptedAt),
        gt(organizationInvites.expiresAt, timestamp)
      )
    )
    .limit(1);

  return result[0] || null;
}

export async function acceptInvite(token: string, userId: string): Promise<boolean> {
  const db = getDb();
  const invite = await getInviteByToken(token);

  if (!invite) {
    return false;
  }

  const timestamp = now();

  // Add user to organization
  await db.insert(organizationMembers).values({
    id: generateId(),
    organizationId: invite.organizationId,
    userId,
    role: invite.role,
    createdAt: timestamp,
  });

  // Mark invite as accepted
  await db
    .update(organizationInvites)
    .set({ acceptedAt: timestamp })
    .where(eq(organizationInvites.id, invite.id));

  return true;
}

export async function checkAndAcceptPendingInvites(userId: string, email: string): Promise<void> {
  const db = getDb();
  const timestamp = now();

  // Find all pending invites for this email
  const pendingInvites = await db
    .select()
    .from(organizationInvites)
    .where(
      and(
        eq(organizationInvites.email, email.toLowerCase()),
        isNull(organizationInvites.acceptedAt),
        gt(organizationInvites.expiresAt, timestamp)
      )
    );

  for (const invite of pendingInvites) {
    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, invite.organizationId),
          eq(organizationMembers.userId, userId)
        )
      )
      .limit(1);

    if (existingMember.length === 0) {
      // Add user to organization
      await db.insert(organizationMembers).values({
        id: generateId(),
        organizationId: invite.organizationId,
        userId,
        role: invite.role,
        createdAt: timestamp,
      });
    }

    // Mark invite as accepted
    await db
      .update(organizationInvites)
      .set({ acceptedAt: timestamp })
      .where(eq(organizationInvites.id, invite.id));
  }
}
