import NextAuth, { type DefaultSession } from "next-auth";
import { authConfig } from "./auth.config";
import { getDb, users } from "@/db";
import { eq } from "drizzle-orm";
import { generateId, now } from "./utils";
import { checkAndAcceptPendingInvites } from "@/services/invites";

declare module "next-auth" {
  interface User {
    role?: string;
    roles?: string[];
  }
  interface Session {
    user: {
      id: string;
      role?: string;
      roles?: string[];
      currentOrgId?: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Ensure user exists in database (server-side only)
      if (user.email) {
        const dbUser = await ensureUserExists({
          id: user.id || generateId(),
          email: user.email,
          name: user.name || user.email.split("@")[0],
          image: user.image,
        });

        // Check for and accept any pending organization invites
        if (dbUser?.id) {
          await checkAndAcceptPendingInvites(dbUser.id, user.email);
        }
      }
      return true;
    },
  },
});

async function ensureUserExists(user: { id: string; email: string; name: string; image?: string | null }) {
  const db = getDb();

  // Check by email first
  const existingByEmail = await db.select().from(users).where(eq(users.email, user.email.toLowerCase())).limit(1);
  if (existingByEmail.length > 0) {
    return existingByEmail[0];
  }

  // Check by ID
  const existingById = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (existingById.length > 0) {
    return existingById[0];
  }

  // Create new user
  const timestamp = now();
  await db.insert(users).values({
    id: user.id,
    email: user.email.toLowerCase(),
    name: user.name,
    image: user.image || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return { id: user.id, email: user.email, name: user.name };
}

async function createCredentialsUser(email: string) {
  const db = getDb();
  const id = generateId();
  const timestamp = now();

  await db.insert(users).values({
    id,
    email: email.toLowerCase(),
    name: email.split("@")[0],
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return { id, email, name: email.split("@")[0] };
}
