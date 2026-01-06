import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserDefaultPage, type LandlordPage } from '@/services/users';

const PAGE_ROUTES: Record<LandlordPage, string> = {
  dashboard: '/landlord', // Special case - won't redirect to itself
  properties: '/landlord/properties',
  listings: '/landlord/listings',
  applications: '/landlord/applications',
  leases: '/landlord/leases',
  maintenance: '/landlord/maintenance',
  reports: '/landlord/reports',
  activity: '/landlord/activity',
  screening: '/landlord/screening',
  settings: '/landlord/settings',
};

export default async function LandlordDashboard() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const defaultPage = await getUserDefaultPage(session.user.id);

  // Redirect to the user's default page (unless it's 'dashboard', which would cause a loop)
  if (defaultPage && defaultPage !== 'dashboard') {
    const route = PAGE_ROUTES[defaultPage];
    if (route) {
      redirect(route);
    }
  }

  // Fallback: redirect to reports if default is dashboard or invalid
  redirect('/landlord/reports');
}
