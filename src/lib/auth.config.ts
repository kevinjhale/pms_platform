import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

// Demo users for development/testing (no DB required in Edge)
const DEMO_USERS: Record<string, { id: string; name: string; email: string; role: string }> = {
  "renter@demo.com": { id: "demo-renter", name: "Demo Renter", email: "renter@demo.com", role: "renter" },
  "landlord@demo.com": { id: "demo-landlord", name: "Demo Landlord", email: "landlord@demo.com", role: "landlord" },
  "manager@demo.com": { id: "demo-manager", name: "Demo Manager", email: "manager@demo.com", role: "manager" },
};

export const authConfig: NextAuthConfig = {
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

        // Check demo users (Edge-compatible)
        const demoUser = DEMO_USERS[email];
        if (demoUser) {
          return demoUser;
        }

        // For non-demo users, we return a basic user object
        // The full DB sync happens in signIn callback (server-side)
        return {
          id: email,
          email,
          name: email.split("@")[0],
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "renter";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
