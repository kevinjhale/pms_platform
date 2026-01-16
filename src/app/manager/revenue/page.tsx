import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import {
  getPMRevenueByProperty,
  getPMRevenueSummary,
  getPMRevenueByMonth,
} from '@/services/pmRevenue';
import PMRevenueContent from './PMRevenueContent';

interface PageProps {
  searchParams: Promise<{
    year?: string;
  }>;
}

export default async function PMRevenuePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = params.year ? parseInt(params.year, 10) : currentYear;
  const validYear = Math.max(currentYear - 5, Math.min(currentYear, year));

  const [summary, byProperty, byMonth] = await Promise.all([
    getPMRevenueSummary(session.user.id),
    getPMRevenueByProperty(session.user.id),
    getPMRevenueByMonth(session.user.id, validYear),
  ]);

  return (
    <PMRevenueContent
      summary={summary}
      byProperty={byProperty}
      byMonth={byMonth}
      year={validYear}
      currentYear={currentYear}
      userName={session.user.name || session.user.email || 'Property Manager'}
    />
  );
}
