import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { getDashboardReport, getRevenueHistory } from "@/services/reports";
import { getRentRoll, calculateRentRollTotals } from "@/services/rentRoll";
import ReportsContent from "./ReportsContent";

export default async function ReportsPage() {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  const [report, revenueHistory, rentRoll] = await Promise.all([
    getDashboardReport(organization.id),
    getRevenueHistory(organization.id, 6),
    getRentRoll(organization.id),
  ]);
  const rentRollTotals = calculateRentRollTotals(rentRoll);
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <ReportsContent
      report={report}
      revenueHistory={revenueHistory}
      rentRollTotals={rentRollTotals}
      organizationName={organization.name}
      currentMonth={currentMonth}
    />
  );
}
