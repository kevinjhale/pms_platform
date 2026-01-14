'use client';

import { useState } from 'react';
import type { UnitTemplate } from '@/db/schema/unitTemplates';

interface AddUnitFormProps {
  templates: UnitTemplate[];
  onSubmit: (formData: FormData) => Promise<void>;
}

export function AddUnitForm({ templates, onSubmit }: AddUnitFormProps) {
  const [formValues, setFormValues] = useState({
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    rentAmount: '',
    depositAmount: '',
    features: '',
    description: '',
  });

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (!templateId) {
      setFormValues({
        bedrooms: '',
        bathrooms: '',
        sqft: '',
        rentAmount: '',
        depositAmount: '',
        features: '',
        description: '',
      });
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormValues({
        bedrooms: String(template.bedrooms),
        bathrooms: String(template.bathrooms),
        sqft: template.sqft ? String(template.sqft) : '',
        rentAmount: String(template.rentAmount / 100),
        depositAmount: template.depositAmount ? String(template.depositAmount / 100) : '',
        features: template.features?.join(', ') || '',
        description: template.description || '',
      });
    }
  };

  return (
    <form action={onSubmit} style={{ marginTop: '1.5rem' }}>
      {templates.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Use Template (optional)
          </label>
          <select
            onChange={handleTemplateChange}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            <option value="">-- Select a template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.bedrooms} bd / {t.bathrooms} ba - ${t.rentAmount / 100}/mo)
              </option>
            ))}
          </select>
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
            Select a template to pre-fill the form fields
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Unit Number
          </label>
          <input
            type="text"
            name="unitNumber"
            placeholder="e.g., 101"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Bedrooms *
          </label>
          <input
            type="number"
            name="bedrooms"
            required
            min="0"
            placeholder="2"
            value={formValues.bedrooms}
            onChange={(e) => setFormValues(v => ({ ...v, bedrooms: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Bathrooms *
          </label>
          <input
            type="number"
            name="bathrooms"
            required
            min="0"
            step="0.5"
            placeholder="1.5"
            value={formValues.bathrooms}
            onChange={(e) => setFormValues(v => ({ ...v, bathrooms: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Sq Ft
          </label>
          <input
            type="number"
            name="sqft"
            min="0"
            placeholder="850"
            value={formValues.sqft}
            onChange={(e) => setFormValues(v => ({ ...v, sqft: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Rent ($/mo) *
          </label>
          <input
            type="number"
            name="rentAmount"
            required
            min="0"
            step="0.01"
            placeholder="1500"
            value={formValues.rentAmount}
            onChange={(e) => setFormValues(v => ({ ...v, rentAmount: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Deposit ($)
          </label>
          <input
            type="number"
            name="depositAmount"
            min="0"
            step="0.01"
            placeholder="1500"
            value={formValues.depositAmount}
            onChange={(e) => setFormValues(v => ({ ...v, depositAmount: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Status
          </label>
          <select
            name="status"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            <option value="unlisted">Unlisted</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
          Features (comma-separated)
        </label>
        <input
          type="text"
          name="features"
          placeholder="e.g., Dishwasher, In-unit laundry, Balcony"
          value={formValues.features}
          onChange={(e) => setFormValues(v => ({ ...v, features: e.target.value }))}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
          }}
        />
      </div>
      <button
        type="submit"
        style={{
          marginTop: '1rem',
          padding: '0.625rem 1.5rem',
          backgroundColor: 'var(--accent-color)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        Add Unit
      </button>
    </form>
  );
}
