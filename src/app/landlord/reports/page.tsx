import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { getDashboardReport, getRevenueHistory } from "@/services/reports";
import { getRentRoll, calculateRentRollTotals, getMonthlyPayments } from "@/services/rentRoll";
import ReportsContent from "./ReportsContent";

interface PageProps {
  searchParams: Promise<{
    startMonth?: string;
    startYear?: string;
    endMonth?: string;
    endYear?: string;
  }>;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default async function ReportsPage({ searchParams }: PageProps) {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const now = new Date();

  // Parse start/end dates from URL params or default to current month
  const startMonth = params.startMonth ? parseInt(params.startMonth, 10) : now.getMonth() + 1;
  const startYear = params.startYear ? parseInt(params.startYear, 10) : now.getFullYear();
  const endMonth = params.endMonth ? parseInt(params.endMonth, 10) : now.getMonth() + 1;
  const endYear = params.endYear ? parseInt(params.endYear, 10) : now.getFullYear();

  // Validate dates
  const minYear = now.getFullYear() - 2;
  const validStartMonth = Math.max(1, Math.min(12, startMonth));
  const validStartYear = Math.max(minYear, Math.min(now.getFullYear(), startYear));
  const validEndMonth = Math.max(1, Math.min(12, endMonth));
  const validEndYear = Math.max(minYear, Math.min(now.getFullYear(), endYear));

  // Ensure end is not before start
  const startDate = new Date(validStartYear, validStartMonth - 1);
  const endDate = new Date(validEndYear, validEndMonth - 1);
  const finalEndMonth = endDate < startDate ? validStartMonth : validEndMonth;
  const finalEndYear = endDate < startDate ? validStartYear : validEndYear;

  const [report, revenueHistory, rentRoll, monthlyPayments] = await Promise.all([
    getDashboardReport(organization.id, validStartMonth, validStartYear, finalEndMonth, finalEndYear),
    getRevenueHistory(organization.id, validStartMonth, validStartYear, finalEndMonth, finalEndYear),
    getRentRoll(organization.id),
    getMonthlyPayments(organization.id, finalEndYear),
  ]);
  const rentRollTotals = calculateRentRollTotals(rentRoll);

  // Format the date range label
  const isSingleMonth = validStartMonth === finalEndMonth && validStartYear === finalEndYear;
  const dateRangeLabel = isSingleMonth
    ? `${MONTHS[validStartMonth - 1]} ${validStartYear}`
    : `${MONTHS[validStartMonth - 1]} ${validStartYear} - ${MONTHS[finalEndMonth - 1]} ${finalEndYear}`;

  return (
    <ReportsContent
      report={report}
      revenueHistory={revenueHistory}
      rentRoll={rentRoll}
      rentRollTotals={rentRollTotals}
      monthlyPayments={monthlyPayments}
      currentYear={finalEndYear}
      organizationName={organization.name}
      dateRangeLabel={dateRangeLabel}
      startMonth={validStartMonth}
      startYear={validStartYear}
      endMonth={finalEndMonth}
      endYear={finalEndYear}
    />
  );
}
