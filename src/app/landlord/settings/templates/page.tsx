import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { getTemplatesByOrganization } from '@/services/unitTemplates';
import { createTemplateAction, deleteTemplateAction } from '@/app/actions/unitTemplates';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  const templates = await getTemplatesByOrganization(organization.id);

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/landlord/settings"
          style={{ color: 'var(--secondary)', fontSize: '0.875rem', textDecoration: 'none' }}
        >
          &larr; Back to Settings
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>Unit Templates</h1>
        <p style={{ color: 'var(--secondary)' }}>
          Create reusable templates for similar units to speed up property setup
        </p>
      </div>

      {/* Create New Template */}
      <section style={{ marginBottom: '2rem' }}>
        <details className="card" style={{ padding: '1.5rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
            + Create New Template
          </summary>
          <form action={createTemplateAction} style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g., 2BR Standard, Studio Deluxe"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="bedrooms" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Bedrooms *
                  </label>
                  <input
                    type="number"
                    id="bedrooms"
                    name="bedrooms"
                    required
                    min="0"
                    placeholder="2"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="bathrooms" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Bathrooms *
                  </label>
                  <input
                    type="number"
                    id="bathrooms"
                    name="bathrooms"
                    required
                    min="0"
                    step="0.5"
                    placeholder="1.5"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="sqft" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Sq Ft
                  </label>
                  <input
                    type="number"
                    id="sqft"
                    name="sqft"
                    min="0"
                    placeholder="850"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="rentAmount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Monthly Rent *
                  </label>
                  <input
                    type="number"
                    id="rentAmount"
                    name="rentAmount"
                    required
                    min="0"
                    step="0.01"
                    placeholder="1500"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="depositAmount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Security Deposit
                  </label>
                  <input
                    type="number"
                    id="depositAmount"
                    name="depositAmount"
                    min="0"
                    step="0.01"
                    placeholder="1500"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="features" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Features (comma-separated)
                </label>
                <input
                  type="text"
                  id="features"
                  name="features"
                  placeholder="Washer/Dryer, Dishwasher, Central AC"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Standard 2-bedroom unit with open floor plan..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Create Template
                </button>
              </div>
            </div>
          </form>
        </details>
      </section>

      {/* Templates List */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          Your Templates ({templates.length})
        </h2>

        {templates.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--secondary)',
            }}
          >
            <p style={{ marginBottom: '0.5rem' }}>No templates yet</p>
            <p style={{ fontSize: '0.875rem' }}>
              Create your first template above to speed up adding similar units
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {templates.map((template) => (
              <div
                key={template.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{template.name}</h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--secondary)', flexWrap: 'wrap' }}>
                    <span>{template.bedrooms} bd / {template.bathrooms % 1 === 0 ? template.bathrooms : template.bathrooms.toFixed(1)} ba</span>
                    {template.sqft && <span>{template.sqft.toLocaleString()} sqft</span>}
                    <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{formatCurrency(template.rentAmount)}/mo</span>
                    {template.depositAmount && (
                      <span>{formatCurrency(template.depositAmount)} deposit</span>
                    )}
                  </div>
                  {template.features && template.features.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {template.features.map((feature, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.5rem',
                            backgroundColor: 'var(--surface)',
                            borderRadius: '4px',
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                  {template.description && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
                      {template.description}
                    </p>
                  )}
                </div>
                <form action={deleteTemplateAction.bind(null, template.id)}>
                  <button
                    type="submit"
                    className="btn"
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.75rem',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fef2f2',
                    }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
