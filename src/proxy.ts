import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Get all roles for the user from session
  const sessionRole = (req.auth?.user as { role?: string })?.role;
  const availableRoles = (req.auth?.user as { roles?: string[] })?.roles || [];

  // Check if user has a specific role (either in roles array or as their primary role)
  const hasRole = (role: string) => availableRoles.includes(role) || sessionRole === role;

  // Protect Dashboard Routes - check if user HAS the role (not just active role)
  if (nextUrl.pathname.startsWith("/renter")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (!hasRole("renter"))
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/landlord")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    // User must have landlord or manager role
    if (!hasRole("landlord") && !hasRole("manager"))
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/manager")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    // User must have manager or landlord role
    if (!hasRole("manager") && !hasRole("landlord"))
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/maintenance")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    // Maintenance workers, managers, and landlords can access maintenance routes
    if (!hasRole("maintenance") && !hasRole("manager") && !hasRole("landlord"))
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
