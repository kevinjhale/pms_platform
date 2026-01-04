
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      role?: string;
    } & DefaultSession["user"];
  }
}

/*
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
*/

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    GitHub,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        let user = null;

        // Mock logic for demo purposes
        const email = credentials.email as string;

        if (email === "renter@demo.com") {
          user = { id: "1", name: "Demo Renter", email: "renter@demo.com", role: "renter" };
        } else if (email === "landlord@demo.com") {
          user = { id: "2", name: "Demo Landlord", email: "landlord@demo.com", role: "landlord" };
        } else if (email === "manager@demo.com") {
          user = { id: "3", name: "Demo Manager", email: "manager@demo.com", role: "manager" };
        } else {
          // Fallback for random valid credentials (in a real app this would check DB)
          // Allowing any other login for now as "New User"
          if (email) {
            user = { id: "4", name: "New User", email: email, role: "renter" };
          }
        }

        if (!user) {
          throw new Error("User not found.");
        }

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      // @ts-ignore
      session.user.role = token.role
      return session
    },
  },
});
