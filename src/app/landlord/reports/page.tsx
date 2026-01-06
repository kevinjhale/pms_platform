import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { getDashboardReport } from "@/services/reports";
import { centsToDollars } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  appliance: "Appliance",
  structural: "Structural",
  pest: "Pest Control",
  landscaping: "Landscaping",
  cleaning: "Cleaning",
  security: "Security",
  other: "Other",
};

export default async function ReportsPage() {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  const report = await getDashboardReport(organization.id);
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Reports & Analytics</h1>
        <p style={{ color: "var(--secondary)" }}>
          Key metrics for {organization.name} - {currentMonth}
        </p>
      </div>

      {/* Occupancy Section */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
          Occupancy Overview
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--primary)" }}>
              {report.occupancy.occupancyRate}%
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Occupancy Rate</div>
          </div>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
              {report.occupancy.totalUnits}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Total Units</div>
          </div>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#15803d" }}>
              {report.occupancy.occupiedUnits}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Occupied</div>
          </div>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#dc2626" }}>
              {report.occupancy.vacantUnits}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Vacant</div>
          </div>
        </div>
      </section>

      {/* Revenue Section */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
          Revenue - {currentMonth}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: "bold" }}>
              ${centsToDollars(report.revenue.expectedMonthly).toLocaleString()}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Expected</div>
          </div>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#15803d" }}>
              ${centsToDollars(report.revenue.collectedThisMonth).toLocaleString()}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Collected</div>
          </div>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#dc2626" }}>
              ${centsToDollars(report.revenue.outstandingBalance).toLocaleString()}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Outstanding</div>
          </div>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "var(--primary)" }}>
              {report.revenue.collectionRate}%
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Collection Rate</div>
          </div>
        </div>
        {report.revenue.overdueCount > 0 && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1rem",
              backgroundColor: "#fef2f2",
              borderRadius: "var(--radius)",
              color: "#991b1b",
              fontSize: "0.875rem",
            }}
          >
            {report.revenue.overdueCount} payment{report.revenue.overdueCount !== 1 ? "s" : ""} overdue
          </div>
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Maintenance Section */}
        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Maintenance
          </h2>
          <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "var(--surface)", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#dc2626" }}>
                  {report.maintenance.openRequests}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Open</div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "var(--surface)", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1d4ed8" }}>
                  {report.maintenance.inProgressRequests}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>In Progress</div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "var(--surface)", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d" }}>
                  {report.maintenance.completedThisMonth}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Completed This Month</div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "var(--surface)", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {report.maintenance.avgCompletionDays}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Avg Days to Complete</div>
              </div>
            </div>

            {Object.keys(report.maintenance.byCategory).length > 0 && (
              <>
                <h3 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.75rem", color: "var(--secondary)" }}>
                  Open Requests by Category
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {Object.entries(report.maintenance.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, count]) => (
                      <div
                        key={category}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.875rem",
                        }}
                      >
                        <span>{CATEGORY_LABELS[category] || category}</span>
                        <span style={{ fontWeight: "500" }}>{count}</span>
                      </div>
                    ))}
                </div>
              </>
            )}

            <Link
              href="/landlord/maintenance"
              className="btn"
              style={{
                marginTop: "1rem",
                width: "100%",
                textAlign: "center",
                border: "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              View All Requests
            </Link>
          </div>
        </section>

        {/* Leases Section */}
        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Lease Expirations
          </h2>
          <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "#fef2f2", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#dc2626" }}>
                  {report.leases.expiringIn30Days}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#991b1b" }}>30 Days</div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "#fef3c7", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#92400e" }}>
                  {report.leases.expiringIn60Days}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#92400e" }}>60 Days</div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "#f0fdf4", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d" }}>
                  {report.leases.expiringIn90Days}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#15803d" }}>90 Days</div>
              </div>
            </div>

            {report.leases.upcomingExpirations.length > 0 ? (
              <>
                <h3 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.75rem", color: "var(--secondary)" }}>
                  Upcoming Expirations
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {report.leases.upcomingExpirations.slice(0, 5).map((lease) => (
                    <Link
                      key={lease.leaseId}
                      href={`/landlord/leases/${lease.leaseId}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                        padding: "0.5rem",
                        backgroundColor: "var(--surface)",
                        borderRadius: "4px",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <span>
                        {lease.tenantName}
                        <span style={{ color: "var(--secondary)", marginLeft: "0.5rem" }}>
                          {lease.propertyName}{lease.unitNumber && ` #${lease.unitNumber}`}
                        </span>
                      </span>
                      <span
                        style={{
                          fontWeight: "500",
                          color: lease.daysUntilExpiry <= 30 ? "#dc2626" : lease.daysUntilExpiry <= 60 ? "#92400e" : "#15803d",
                        }}
                      >
                        {lease.daysUntilExpiry}d
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>
                No leases expiring in the next 90 days.
              </p>
            )}

            <Link
              href="/landlord/leases"
              className="btn"
              style={{
                marginTop: "1rem",
                width: "100%",
                textAlign: "center",
                border: "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              View All Leases
            </Link>
          </div>
        </section>
      </div>

      {/* Applications Section */}
      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
          Applications - {currentMonth}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#f59e0b" }}>
              {report.applications.pendingApplications}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Pending Review</div>
          </div>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d" }}>
              {report.applications.approvedThisMonth}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Approved</div>
          </div>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#dc2626" }}>
              {report.applications.rejectedThisMonth}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Rejected</div>
          </div>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {report.applications.avgProcessingDays}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Avg Processing Days</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius)",
          fontSize: "0.75rem",
          color: "var(--secondary)",
          textAlign: "center",
        }}
      >
        Report generated at {report.generatedAt.toLocaleString()}
      </div>
    </main>
  );
}
