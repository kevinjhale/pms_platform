import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const role = (req.auth?.user as { role?: string })?.role;

  // Protect Dashboard Routes
  if (nextUrl.pathname.startsWith("/renter")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "renter")
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/landlord")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "landlord" && role !== "manager")
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/manager")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "manager")
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/maintenance")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    // Maintenance workers and managers/landlords can access maintenance routes
    if (role !== "maintenance" && role !== "manager" && role !== "landlord")
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
