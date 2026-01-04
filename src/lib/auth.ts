import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { getDb, users } from "@/db";
import { eq } from "drizzle-orm";
import { generateId, now } from "./utils";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      role?: string;
      currentOrgId?: string;
    } & DefaultSession["user"];
  }
}

// Demo users for development/testing
const DEMO_USERS: Record<string, { id: string; name: string; email: string; role: string }> = {
  "renter@demo.com": { id: "demo-renter", name: "Demo Renter", email: "renter@demo.com", role: "renter" },
  "landlord@demo.com": { id: "demo-landlord", name: "Demo Landlord", email: "landlord@demo.com", role: "landlord" },
  "manager@demo.com": { id: "demo-manager", name: "Demo Manager", email: "manager@demo.com", role: "manager" },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Google,
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = (credentials.email as string)?.toLowerCase();
        if (!email) return null;

        // Check demo users first
        const demoUser = DEMO_USERS[email];
        if (demoUser) {
          await ensureUserExists(demoUser);
          return demoUser;
        }

        // For real users, check database
        const db = getDb();
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const user = result[0];

        if (user) {
          // TODO: In production, verify password hash here
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        }

        // Create new user for credentials login (development only)
        const newUser = await createCredentialsUser(email);
        return {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, ensure user exists in our database
      if (account?.provider !== "credentials" && user.email) {
        await ensureUserExists({
          id: user.id || generateId(),
          email: user.email,
          name: user.name || user.email.split("@")[0],
          image: user.image,
        });
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "renter";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
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
