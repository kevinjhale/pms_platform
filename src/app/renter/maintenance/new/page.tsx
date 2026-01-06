import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLeasesByTenant } from '@/services/leases';
import { createMaintenanceRequest } from '@/services/maintenance';
import MaintenanceFormClient from './MaintenanceFormClient';

async function submitRequest(formData: FormData) {
  'use server';

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const unitId = formData.get('unitId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const priority = formData.get('priority') as string;
  const photosJson = formData.get('photos') as string;

  if (!unitId || !title || !description || !category) {
    throw new Error('Missing required fields');
  }

  let photos: string[] | undefined;
  try {
    photos = photosJson ? JSON.parse(photosJson) : undefined;
  } catch {
    photos = undefined;
  }

  await createMaintenanceRequest({
    unitId,
    requestedBy: session.user.id,
    title,
    description,
    category: category as 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest' | 'landscaping' | 'cleaning' | 'security' | 'other',
    priority: priority as 'low' | 'medium' | 'high' | 'emergency',
    photos,
  });

  redirect('/renter/maintenance');
}

export default async function NewMaintenanceRequestPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const leases = await getLeasesByTenant(session.user.id);
  const activeLease = leases.find((l) => l.status === 'active');

  if (!activeLease) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>New Maintenance Request</h1>
        <div
          style={{
            padding: '2rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--secondary)' }}>
            You need an active lease to submit maintenance requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>New Maintenance Request</h1>
      <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
        Submit a request for repairs or maintenance.
      </p>

      <MaintenanceFormClient unitId={activeLease.unitId} submitAction={submitRequest} />
    </div>
  );
}
