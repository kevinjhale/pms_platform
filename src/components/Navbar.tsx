import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { getUserRoles } from "@/services/users";

const navLinkStyle = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--secondary)',
    textDecoration: 'none',
    transition: 'color 0.2s',
};

const ROLE_LABELS: Record<string, string> = {
    renter: 'Renter',
    landlord: 'Landlord',
    manager: 'Manager',
    maintenance: 'Maintenance',
};

export default async function Navbar() {
    const session = await auth();
    const userRoles = session?.user?.id ? await getUserRoles(session.user.id) : [];

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
                                {userRoles.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.125rem' }}>
                                        {userRoles.map((role) => (
                                            <span
                                                key={role}
                                                style={{
                                                    fontSize: '0.625rem',
                                                    padding: '0.125rem 0.375rem',
                                                    borderRadius: '4px',
                                                    backgroundColor: 'var(--surface)',
                                                    color: 'var(--secondary)',
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {ROLE_LABELS[role] || role}
                                            </span>
                                        ))}
                                    </div>
                                )}
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
