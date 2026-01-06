import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getPropertyById, getUnitById } from '@/services/properties';
import { updateUnitAction, deleteUnitAction } from '@/app/actions/properties';
import { centsToDollars } from '@/lib/utils';
import { DeleteUnitButton } from '@/components/DeleteUnitButton';
import Link from 'next/link';

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { id: propertyId, unitId } = await params;

  const [property, unit] = await Promise.all([
    getPropertyById(propertyId),
    getUnitById(unitId),
  ]);

  if (!property || !unit) {
    notFound();
  }

  // Ensure unit belongs to the property
  if (unit.propertyId !== propertyId) {
    notFound();
  }

  const updateUnitWithIds = updateUnitAction.bind(null, unitId, propertyId);
  const deleteUnitWithIds = deleteUnitAction.bind(null, unitId, propertyId);

  async function handleSubmit(formData: FormData) {
    'use server';
    await updateUnitWithIds(formData);
    redirect(`/landlord/properties/${propertyId}`);
  }

  async function handleDelete() {
    'use server';
    await deleteUnitWithIds();
    redirect(`/landlord/properties/${propertyId}`);
  }

  const unitLabel = unit.unitNumber ? `Unit ${unit.unitNumber}` : 'Unit';

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '700px' }}>
      <Link
        href={`/landlord/properties/${propertyId}`}
        style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Back to {property.name}
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Edit {unitLabel}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {property.name} - {property.address}
          </p>
        </div>
<DeleteUnitButton onDelete={handleDelete} />
      </div>

      <form action={handleSubmit}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Unit Number */}
          <div>
            <label htmlFor="unitNumber" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Unit Number
            </label>
            <input
              type="text"
              id="unitNumber"
              name="unitNumber"
              defaultValue={unit.unitNumber || ''}
              placeholder="e.g., 101, A, Ground Floor"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>

          {/* Bedrooms & Bathrooms */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                defaultValue={unit.bedrooms}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
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
                defaultValue={unit.bathrooms}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>

          {/* Square Footage */}
          <div>
            <label htmlFor="sqft" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Square Footage
            </label>
            <input
              type="number"
              id="sqft"
              name="sqft"
              min="0"
              defaultValue={unit.sqft || ''}
              placeholder="e.g., 850"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>

          {/* Rent & Deposit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="rentAmount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Monthly Rent ($) *
              </label>
              <input
                type="number"
                id="rentAmount"
                name="rentAmount"
                required
                min="0"
                step="0.01"
                defaultValue={centsToDollars(unit.rentAmount)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div>
              <label htmlFor="depositAmount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Security Deposit ($)
              </label>
              <input
                type="number"
                id="depositAmount"
                name="depositAmount"
                min="0"
                step="0.01"
                defaultValue={unit.depositAmount ? centsToDollars(unit.depositAmount) : ''}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={unit.status}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: 'var(--bg-primary)',
              }}
            >
              <option value="unlisted">Unlisted - Not visible publicly</option>
              <option value="available">Available - Listed for rent</option>
              <option value="occupied">Occupied - Currently rented</option>
              <option value="maintenance">Maintenance - Under repair</option>
            </select>
          </div>

          {/* Features */}
          <div>
            <label htmlFor="features" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Features (comma-separated)
            </label>
            <input
              type="text"
              id="features"
              name="features"
              defaultValue={unit.features?.join(', ') || ''}
              placeholder="e.g., Dishwasher, In-unit laundry, Balcony"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={unit.description || ''}
              placeholder="Describe the unit..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save Changes
            </button>
            <Link
              href={`/landlord/properties/${propertyId}`}
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                textDecoration: 'none',
              }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
