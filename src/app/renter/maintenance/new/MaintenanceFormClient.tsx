'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';

interface MaintenanceFormClientProps {
  unitId: string;
  submitAction: (formData: FormData) => Promise<void>;
}

export default function MaintenanceFormClient({ unitId, submitAction }: MaintenanceFormClientProps) {
  const [photos, setPhotos] = useState<string[]>([]);

  return (
    <div className="card" style={{ padding: '1.5rem', maxWidth: '600px' }}>
      <form action={submitAction}>
        <input type="hidden" name="unitId" value={unitId} />
        <input type="hidden" name="photos" value={JSON.stringify(photos)} />

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="title"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            placeholder="Brief description of the issue"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="category"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
          >
            Category *
          </label>
          <select
            id="category"
            name="category"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              fontSize: '1rem',
              backgroundColor: 'var(--background)',
            }}
          >
            <option value="">Select a category</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC / Heating / Cooling</option>
            <option value="appliance">Appliance</option>
            <option value="structural">Structural</option>
            <option value="pest">Pest Control</option>
            <option value="security">Safety / Security</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="priority"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
          >
            Priority *
          </label>
          <select
            id="priority"
            name="priority"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              fontSize: '1rem',
              backgroundColor: 'var(--background)',
            }}
          >
            <option value="low">Low - Can wait a few days</option>
            <option value="medium">Medium - Should be addressed soon</option>
            <option value="high">High - Urgent issue</option>
            <option value="emergency">Emergency - Immediate attention needed</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="description"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
          >
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            placeholder="Please describe the issue in detail. Include location within the unit, when it started, and any relevant information."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              fontSize: '1rem',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Photos (optional)
          </label>
          <FileUpload onUpload={setPhotos} maxFiles={5} />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary">
            Submit Request
          </button>
          <a href="/renter/maintenance" className="btn btn-secondary">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
