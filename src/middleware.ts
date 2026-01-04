
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;
    const role = (req.auth?.user as any)?.role;

    // Protect Dashboard Routes
    if (nextUrl.pathname.startsWith('/renter')) {
        if (!isLoggedIn) return NextResponse.redirect(new URL('/login', nextUrl));
        if (role !== 'renter') return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }

    if (nextUrl.pathname.startsWith('/landlord')) {
        if (!isLoggedIn) return NextResponse.redirect(new URL('/login', nextUrl));
        if (role !== 'landlord' && role !== 'manager') return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }

    if (nextUrl.pathname.startsWith('/manager')) {
        if (!isLoggedIn) return NextResponse.redirect(new URL('/login', nextUrl));
        if (role !== 'manager') return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
