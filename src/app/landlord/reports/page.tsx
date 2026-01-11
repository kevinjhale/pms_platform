import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { getDashboardReport, getRevenueHistory } from "@/services/reports";
import { getRentRoll, calculateRentRollTotals, getMonthlyPayments } from "@/services/rentRoll";
import ReportsContent from "./ReportsContent";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  // Get the search params (await since it's a Promise in Next.js 15+)
  const params = await searchParams;

  // Parse month/year from URL params or default to current
  const now = new Date();
  const selectedMonth = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const selectedYear = params.year ? parseInt(params.year, 10) : now.getFullYear();

  // Validate month/year
  const validMonth = Math.max(1, Math.min(12, selectedMonth));
  const validYear = Math.max(now.getFullYear() - 2, Math.min(now.getFullYear(), selectedYear));

  const [report, revenueHistory, rentRoll, monthlyPayments] = await Promise.all([
    getDashboardReport(organization.id, validMonth, validYear),
    getRevenueHistory(organization.id, 6, validMonth, validYear),
    getRentRoll(organization.id),
    getMonthlyPayments(organization.id, validYear),
  ]);
  const rentRollTotals = calculateRentRollTotals(rentRoll);

  // Format the display month
  const displayDate = new Date(validYear, validMonth - 1);
  const currentMonth = displayDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <ReportsContent
      report={report}
      revenueHistory={revenueHistory}
      rentRoll={rentRoll}
      rentRollTotals={rentRollTotals}
      monthlyPayments={monthlyPayments}
      currentYear={validYear}
      organizationName={organization.name}
      currentMonth={currentMonth}
      selectedMonth={validMonth}
      selectedYear={validYear}
    />
  );
}
