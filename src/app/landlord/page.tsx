import Link from 'next/link';

export default function LandlordDashboard() {
    return (
        <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Landlord & Manager Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Listing Engine */}
                <div className="card">
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🏠 Listing Engine
                    </h3>
                    <p style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>
                        Create immersive listings with our advanced editor.
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', color: 'var(--secondary)', fontSize: '0.875rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>✨ Upload High-Res Photos & 3D Tours</li>
                        <li style={{ marginBottom: '0.5rem' }}>📝 Detailed Property Specifications</li>
                        <li style={{ marginBottom: '0.5rem' }}>🗺️ Integrated Map Services</li>
                    </ul>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                        <Link href="/landlord/listings/new" className="btn btn-primary" style={{ flex: 1 }}>Create New</Link>
                        <Link href="/landlord/listings" className="btn" style={{ flex: 1, border: '1px solid var(--border)' }}>Manage All</Link>
                    </div>
                </div>

                {/* Application Portal */}
                <div className="card">
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📥 Application Portal
                    </h3>
                    <p style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>
                        Review incoming tenant applications and documents.
                    </p>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>3</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Pending Reviews</div>
                    </div>
                    <Link href="/landlord/applications" className="btn" style={{ width: '100%', border: '1px solid var(--border)' }}>View Applications</Link>
                </div>

                {/* Background Screening */}
                <div className="card">
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🔍 Background Screening
                    </h3>
                    <p style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>
                        Secure credit & criminal checks via trusted partners.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }}>TransUnion</span>
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: '4px' }}>Experian</span>
                    </div>
                    <Link href="/landlord/screening" className="btn" style={{ width: '100%', border: '1px solid var(--border)' }}>Request Screening</Link>
                </div>
            </div>
        </main>
    );
}
