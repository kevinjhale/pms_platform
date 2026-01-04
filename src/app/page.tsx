import Link from 'next/link';

export default function Home() {
  return (
    <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1.5rem' }}>
          <span className="text-gradient">Modern Property Management</span>
          <br />
          Unified Platform
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          A triple-sided marketplace connecting Renters, Property Managers, and Landlords in one seamless ecosystem.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <Link href="/login?role=renter" className="card" style={{ textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Renter Login</h3>
          <p style={{ color: 'var(--secondary)' }}>Search listings, submit applications, and manage payments easily.</p>
        </Link>
        <Link href="/login?role=landlord" className="card" style={{ textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Landlord & Manager Login</h3>
          <p style={{ color: 'var(--secondary)' }}>List properties, screening, operations, and financials.</p>
        </Link>
      </div>
    </main>
  );
}
