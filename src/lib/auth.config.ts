import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

// Demo users for development/testing (no DB required in Edge)
const DEMO_USERS: Record<string, { id: string; name: string; email: string; role: string }> = {
  // Original demo users
  "renter@demo.com": { id: "demo-renter", name: "Demo Renter", email: "renter@demo.com", role: "renter" },
  "landlord@demo.com": { id: "demo-landlord", name: "Demo Landlord", email: "landlord@demo.com", role: "landlord" },
  "manager@demo.com": { id: "demo-manager", name: "Demo Manager", email: "manager@demo.com", role: "manager" },

  // 10 Renters
  "alice.johnson@demo.com": { id: "renter-1", name: "Alice Johnson", email: "alice.johnson@demo.com", role: "renter" },
  "bob.smith@demo.com": { id: "renter-2", name: "Bob Smith", email: "bob.smith@demo.com", role: "renter" },
  "carol.williams@demo.com": { id: "renter-3", name: "Carol Williams", email: "carol.williams@demo.com", role: "renter" },
  "david.brown@demo.com": { id: "renter-4", name: "David Brown", email: "david.brown@demo.com", role: "renter" },
  "emma.davis@demo.com": { id: "renter-5", name: "Emma Davis", email: "emma.davis@demo.com", role: "renter" },
  "frank.miller@demo.com": { id: "renter-6", name: "Frank Miller", email: "frank.miller@demo.com", role: "renter" },
  "grace.wilson@demo.com": { id: "renter-7", name: "Grace Wilson", email: "grace.wilson@demo.com", role: "renter" },
  "henry.moore@demo.com": { id: "renter-8", name: "Henry Moore", email: "henry.moore@demo.com", role: "renter" },
  "iris.taylor@demo.com": { id: "renter-9", name: "Iris Taylor", email: "iris.taylor@demo.com", role: "renter" },
  "jack.anderson@demo.com": { id: "renter-10", name: "Jack Anderson", email: "jack.anderson@demo.com", role: "renter" },

  // 3 Landlords
  "john.properties@demo.com": { id: "landlord-1", name: "John Properties", email: "john.properties@demo.com", role: "landlord" },
  "sarah.realty@demo.com": { id: "landlord-2", name: "Sarah Realty", email: "sarah.realty@demo.com", role: "landlord" },
  "mike.estates@demo.com": { id: "landlord-3", name: "Mike Estates", email: "mike.estates@demo.com", role: "landlord" },

  // 3 Property Managers
  "pm.lisa@demo.com": { id: "manager-1", name: "Lisa Chen (PM)", email: "pm.lisa@demo.com", role: "manager" },
  "pm.robert@demo.com": { id: "manager-2", name: "Robert Garcia (PM)", email: "pm.robert@demo.com", role: "manager" },
  "pm.maria@demo.com": { id: "manager-3", name: "Maria Santos (PM)", email: "pm.maria@demo.com", role: "manager" },

  // Maintenance Worker
  "maint.joe@demo.com": { id: "maintenance-1", name: "Joe Fix-It", email: "maint.joe@demo.com", role: "maintenance" },
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
