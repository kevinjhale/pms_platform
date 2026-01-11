import Link from 'next/link';

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--background) 100%)',
        padding: '6rem 0',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            <span className="text-gradient">Modern Property Management</span>
            <br />
            Made Simple
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--secondary)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            The all-in-one platform connecting renters, landlords, and property managers.
            Streamline operations, automate rent collection, and grow your portfolio.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '0.875rem 2rem' }}>
              Get Started Free
            </Link>
            <Link href="/features" className="btn" style={{ fontSize: '1.125rem', padding: '0.875rem 2rem', border: '1px solid var(--border)' }}>
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '3rem 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent)' }}>10k+</div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>Properties Managed</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent)' }}>$2M+</div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>Rent Collected</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent)' }}>98%</div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>On-Time Payments</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent)' }}>4.9/5</div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.75rem' }}>Built for Everyone</h2>
          <p style={{ textAlign: 'center', color: 'var(--secondary)', marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem' }}>
            Whether you're renting your first apartment or managing hundreds of units, we've got you covered.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏠</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>For Renters</h3>
              <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Find your perfect home, apply online, pay rent securely, and submit maintenance requests with ease.
              </p>
              <ul style={{ color: 'var(--secondary)', fontSize: '0.875rem', paddingLeft: '1.25rem' }}>
                <li>Online rent payments</li>
                <li>Maintenance request portal</li>
                <li>Document storage</li>
                <li>Payment history</li>
              </ul>
            </div>
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏢</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>For Landlords</h3>
              <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                List properties, screen tenants, collect rent automatically, and track your portfolio performance.
              </p>
              <ul style={{ color: 'var(--secondary)', fontSize: '0.875rem', paddingLeft: '1.25rem' }}>
                <li>Automated rent collection</li>
                <li>Tenant screening</li>
                <li>Financial reporting</li>
                <li>Lease management</li>
              </ul>
            </div>
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>For Managers</h3>
              <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Oversee multiple properties, coordinate vendors, and streamline day-to-day operations.
              </p>
              <ul style={{ color: 'var(--secondary)', fontSize: '0.875rem', paddingLeft: '1.25rem' }}>
                <li>Multi-property dashboard</li>
                <li>Maintenance coordination</li>
                <li>Team management</li>
                <li>Vendor tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '5rem 0',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to Get Started?</h2>
          <p style={{ color: 'var(--secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Join thousands of property owners and managers who trust our platform.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '0.875rem 2rem' }}>
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '3rem 0', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
              © 2025 PMS Platform. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <Link href="/features" style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Features</Link>
              <Link href="/pricing" style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Pricing</Link>
              <Link href="/contact" style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
