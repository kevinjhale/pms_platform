import Link from 'next/link';

const features = [
  {
    category: 'Rent Collection',
    icon: '💰',
    items: [
      { title: 'Online Payments', description: 'Accept rent via ACH, credit card, or debit card with automatic reminders.' },
      { title: 'Auto-Pay Setup', description: 'Tenants can set up recurring payments to never miss a due date.' },
      { title: 'Late Fee Automation', description: 'Automatically apply late fees based on your lease terms.' },
      { title: 'Payment Tracking', description: 'Real-time dashboard showing paid, pending, and overdue payments.' },
    ]
  },
  {
    category: 'Property Management',
    icon: '🏢',
    items: [
      { title: 'Unit Management', description: 'Track all units across multiple properties with detailed profiles.' },
      { title: 'Lease Tracking', description: 'Monitor lease terms, expiration dates, and renewal opportunities.' },
      { title: 'Document Storage', description: 'Securely store leases, inspection reports, and important documents.' },
      { title: 'Occupancy Reports', description: 'Real-time occupancy rates and vacancy tracking.' },
    ]
  },
  {
    category: 'Maintenance',
    icon: '🔧',
    items: [
      { title: 'Request Portal', description: 'Tenants submit requests with photos and priority levels.' },
      { title: 'Work Order Management', description: 'Assign, track, and complete maintenance tasks efficiently.' },
      { title: 'Vendor Coordination', description: 'Manage preferred vendors and track service history.' },
      { title: 'Preventive Scheduling', description: 'Schedule recurring maintenance to prevent costly repairs.' },
    ]
  },
  {
    category: 'Tenant Screening',
    icon: '🔍',
    items: [
      { title: 'Online Applications', description: 'Customizable application forms with document uploads.' },
      { title: 'Background Checks', description: 'Credit, criminal, and eviction history verification.' },
      { title: 'Income Verification', description: 'Verify employment and income documentation.' },
      { title: 'Reference Checks', description: 'Contact previous landlords and employers.' },
    ]
  },
  {
    category: 'Financial Reporting',
    icon: '📊',
    items: [
      { title: 'Income Statements', description: 'Track revenue, expenses, and net operating income.' },
      { title: 'Rent Roll Reports', description: 'Complete overview of all rental income by property.' },
      { title: 'Expense Tracking', description: 'Categorize and track all property-related expenses.' },
      { title: 'Tax Preparation', description: 'Generate reports ready for tax filing.' },
    ]
  },
  {
    category: 'Communication',
    icon: '💬',
    items: [
      { title: 'Tenant Messaging', description: 'Send announcements, reminders, and updates to tenants.' },
      { title: 'Email Notifications', description: 'Automated emails for payments, maintenance, and leases.' },
      { title: 'Document Sharing', description: 'Securely share documents with tenants and owners.' },
      { title: 'Audit Trail', description: 'Complete history of all communications and actions.' },
    ]
  },
];

export default function FeaturesPage() {
  return (
    <main>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--background) 100%)',
        padding: '5rem 0',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }}>
            Powerful Features for
            <br />
            <span className="text-gradient">Modern Property Management</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Everything you need to manage properties efficiently, from rent collection to maintenance tracking.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            {features.map((category) => (
              <div key={category.category}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{category.category}</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {category.items.map((item) => (
                    <div key={item.title} className="card" style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{item.title}</h3>
                      <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to streamline your property management?</h2>
          <p style={{ color: 'var(--secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Start your free trial today and see the difference.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
              Get Started Free
            </Link>
            <Link href="/pricing" className="btn" style={{ padding: '0.875rem 2rem', border: '1px solid var(--border)' }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
