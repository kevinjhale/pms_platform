import Link from 'next/link';

export default function RenterDashboard() {
    return (
        <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Renter Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Search Listings */}
                <div className="card">
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🔍 Find Your Home
                    </h3>
                    <p style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>
                        Browse thousands of verified listings with immersive 3D tours.
                    </p>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                        <input placeholder="Search by city, zip..." style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                    </div>
                    <Link href="/renter/browse" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}>Browse Listings</Link>
                </div>

                {/* Application Portal */}
                <div className="card">
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📝 Application Portal
                    </h3>
                    <p style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>
                        Manage your rental applications and documents in one place.
                    </p>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                        <div style={{ marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Documents Status</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', border: '1px solid #bbf7d0' }}>ID Verified ✅</span>
                            <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', border: '1px solid #bbf7d0' }}>Income Verified ✅</span>
                            <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '4px', border: '1px solid #fecaca' }}>W2 Needed ⚠️</span>
                        </div>
                    </div>
                    <button className="btn" style={{ width: '100%', border: '1px solid var(--border)' }}>View My Applications</button>
                </div>
            </div>
        </main>
    );
}
