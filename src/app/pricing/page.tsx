import Link from 'next/link';

const hostingPlans = [
  {
    name: 'Starter',
    price: 0,
    description: 'Perfect for landlords just getting started.',
    units: 'Up to 5 units',
    features: [
      'Online rent collection',
      'Basic maintenance tracking',
      'Tenant communication',
      'Payment reminders',
      'Mobile app access',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: 29,
    description: 'For growing portfolios that need more power.',
    units: 'Up to 25 units',
    features: [
      'Everything in Starter',
      'Tenant screening',
      'Financial reporting',
      'Lease management',
      'Document storage',
      'Late fee automation',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 79,
    description: 'Full-featured solution for property managers.',
    units: 'Unlimited units',
    features: [
      'Everything in Professional',
      'Multi-property dashboard',
      'Team management',
      'Vendor management',
      'Custom reporting',
      'API access',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'Can I try before I buy?',
    answer: 'Yes! All hosted plans come with a 14-day free trial. No credit card required to start.',
  },
  {
    question: 'What\'s the difference between hosted and self-hosted?',
    answer: 'Hosted plans include everything: servers, updates, backups, and support. Self-hosted means you run the software on your own servers - you get full control but handle your own infrastructure.',
  },
  {
    question: 'How do license upgrades work?',
    answer: 'Your license covers the major version you purchased (e.g., v1.x). When a new major version releases (e.g., v2.0), you can upgrade for just $50 regardless of how many versions behind you are.',
  },
  {
    question: 'Where is the self-hosting documentation?',
    answer: 'All documentation for self-hosting is available on our GitHub repository, including Docker setup, configuration guides, and migration scripts.',
  },
  {
    question: 'Can I switch from self-hosted to hosted?',
    answer: 'Absolutely. We can help migrate your data to our hosted platform at any time. Contact support for assistance.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes, hosted plans save 20% when paid annually instead of monthly.',
  },
];

export default function PricingPage() {
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
            Simple, Transparent
            <br />
            <span className="text-gradient">Pricing</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--secondary)', maxWidth: '550px', margin: '0 auto' }}>
            Choose managed hosting for a hassle-free experience, or self-host with a one-time license purchase.
          </p>
        </div>
      </section>

      {/* Self-Hosted License Section */}
      <section style={{ padding: '4rem 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card" style={{ padding: '2.5rem', border: '2px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                <div style={{ flex: '1', minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Self-Hosted License</h2>
                    <span style={{
                      background: 'var(--accent)',
                      color: 'white',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                    }}>
                      One-Time
                    </span>
                  </div>
                  <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Run the software on your own infrastructure with full control. All documentation and Docker setup guides available on GitHub.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--accent)' }}>✓</span>
                      Full source code access
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--accent)' }}>✓</span>
                      Unlimited units & users
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--accent)' }}>✓</span>
                      All features included
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--accent)' }}>✓</span>
                      Community support via GitHub
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--accent)' }}>✓</span>
                      Updates for current major version
                    </li>
                  </ul>
                </div>
                <div style={{ textAlign: 'center', minWidth: '180px' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '3rem', fontWeight: '700' }}>$229</span>
                  </div>
                  <p style={{ color: 'var(--secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>one-time payment</p>
                  <Link href="/contact" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem 1.5rem', marginBottom: '1rem' }}>
                    Purchase License
                  </Link>
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Major Version Upgrades</div>
                    <div style={{ color: 'var(--secondary)' }}>Only <strong>$50</strong> to upgrade</div>
                    <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      (any version to latest)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Managed Hosting Section */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Managed Hosting</h2>
            <p style={{ color: 'var(--secondary)', maxWidth: '500px', margin: '0 auto' }}>
              Let us handle the infrastructure. We manage servers, updates, backups, and security so you can focus on your properties.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '950px', margin: '0 auto' }}>
            {hostingPlans.map((plan) => (
              <div
                key={plan.name}
                className="card"
                style={{
                  padding: '2rem',
                  border: plan.highlighted ? '2px solid var(--accent)' : '1px solid var(--border)',
                  position: 'relative',
                }}
              >
                {plan.highlighted && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--accent)',
                    color: 'white',
                    padding: '0.25rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                  }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>{plan.name}</h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>{plan.description}</p>
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: '700' }}>${plan.price}</span>
                  <span style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>/month</span>
                </div>
                <p style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '1.5rem' }}>{plan.units}</p>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--accent)' }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === 'Enterprise' ? '/contact' : '/login'}
                  className={`btn ${plan.highlighted ? 'btn-primary' : ''}`}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    padding: '0.75rem',
                    border: plan.highlighted ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Note */}
      <section style={{ padding: '2rem 0 4rem', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{
            maxWidth: '700px',
            margin: '0 auto',
            textAlign: 'center',
            padding: '1.5rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Not sure which option is right for you?</h3>
            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              <strong>Choose self-hosted</strong> if you have technical expertise and want full control over your data and infrastructure.
              <br />
              <strong>Choose managed hosting</strong> if you want a hassle-free experience with automatic updates and professional support.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '4rem 0', background: 'var(--surface)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem' }}>Frequently Asked Questions</h2>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {faqs.map((faq) => (
              <div key={faq.question} style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{faq.question}</h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '4rem 0', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Still have questions?</h2>
          <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
            Our team is here to help you find the perfect option for your needs.
          </p>
          <Link href="/contact" className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
