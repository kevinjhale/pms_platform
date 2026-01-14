import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { getDashboardConfig, getDashboardData, getDefaultDashboardCards } from '@/services/dashboard';
import { DashboardContent } from './DashboardContent';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  // Get user's dashboard configuration
  const config = await getDashboardConfig(session.user.id);
  const cards = config?.cards ?? getDefaultDashboardCards();

  // Fetch only the data needed for the user's cards
  const data = await getDashboardData(organization.id, cards);

  return (
    <DashboardContent
      initialCards={cards}
      data={data}
      organizationName={organization.name}
    />
  );
}
