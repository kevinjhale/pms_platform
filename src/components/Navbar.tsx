import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

const navLinkStyle = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--secondary)',
    textDecoration: 'none',
    transition: 'color 0.2s',
};

export default async function Navbar() {
    const session = await auth();

    return (
        <nav style={{
            borderBottom: '1px solid var(--border)',
            padding: '1rem 0',
            backgroundColor: 'var(--background)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    PMS <span style={{ color: 'var(--accent)' }}>Platform</span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    {session ? (
                        <>
                            <Link href="/dashboard" style={navLinkStyle}>
                                Dashboard
                            </Link>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{session.user?.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'capitalize' }}>
                                    {(session.user as any)?.role}
                                </div>
                            </div>
                            <form action={async () => {
                                "use server"
                                await signOut({ redirectTo: "/login" });
                            }}>
                                <button type="submit" className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', border: '1px solid var(--border)', backgroundColor: 'transparent' }}>
                                    Logout
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <Link href="/" style={navLinkStyle}>Home</Link>
                            <Link href="/features" style={navLinkStyle}>Features</Link>
                            <Link href="/pricing" style={navLinkStyle}>Pricing</Link>
                            <Link href="/contact" style={navLinkStyle}>Contact Us</Link>
                            <Link href="/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                Sign In
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
