import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const ROLE_COOKIE_NAME = 'pms_active_role';

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Get active role from cookie first (fast), then fall back to session
  const cookieRole = req.cookies.get(ROLE_COOKIE_NAME)?.value;
  const sessionRole = (req.auth?.user as { role?: string })?.role;
  const activeRole = cookieRole || sessionRole;

  // Get all available roles for the user (for checking access)
  const availableRoles = (req.auth?.user as { roles?: string[] })?.roles || [];
  const hasRole = (role: string) => availableRoles.includes(role) || activeRole === role;

  // Protect Dashboard Routes
  if (nextUrl.pathname.startsWith("/renter")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    // User must have renter role AND it must be their active role
    if (activeRole !== "renter")
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/landlord")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    // User's active role must be landlord or manager
    if (activeRole !== "landlord" && activeRole !== "manager")
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/manager")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    // User's active role must be manager (or landlord who also manages)
    if (activeRole !== "manager" && activeRole !== "landlord")
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/maintenance")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    // Maintenance workers and managers/landlords can access maintenance routes
    if (activeRole !== "maintenance" && activeRole !== "manager" && activeRole !== "landlord")
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
