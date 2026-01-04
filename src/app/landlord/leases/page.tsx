import Link from "next/link";
import { getLeasesByOrganization } from "@/services/leases";
import { getOrgContext } from "@/lib/org-context";
import { redirect } from "next/navigation";
import { centsToDollars } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "#f1f5f9", color: "#64748b", label: "Draft" },
  pending: { bg: "#fff7ed", color: "#9a3412", label: "Pending" },
  active: { bg: "#f0fdf4", color: "#15803d", label: "Active" },
  expired: { bg: "#fef3c7", color: "#92400e", label: "Expired" },
  terminated: { bg: "#fee2e2", color: "#991b1b", label: "Terminated" },
  renewed: { bg: "#eff6ff", color: "#1d4ed8", label: "Renewed" },
};

export default async function LeasesPage() {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  const leases = await getLeasesByOrganization(organization.id);

  const activeLeases = leases.filter((l) => l.status === "active");
  const pendingLeases = leases.filter((l) => l.status === "pending" || l.status === "draft");

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Leases</h1>
          <p style={{ color: "var(--secondary)" }}>
            Manage tenant leases and agreements.
            {activeLeases.length > 0 && ` ${activeLeases.length} active leases.`}
          </p>
        </div>
        <Link href="/landlord/leases/new" className="btn btn-primary">
          New Lease
        </Link>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{activeLeases.length}</div>
          <div style={{ color: "var(--secondary)" }}>Active Leases</div>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{pendingLeases.length}</div>
          <div style={{ color: "var(--secondary)" }}>Pending</div>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
            ${activeLeases
              .reduce((sum, l) => sum + centsToDollars(l.monthlyRent), 0)
              .toLocaleString()}
          </div>
          <div style={{ color: "var(--secondary)" }}>Monthly Revenue</div>
        </div>
      </div>

      {/* Leases Table */}
      {leases.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--surface)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <th style={{ padding: "1rem" }}>Tenant</th>
                <th style={{ padding: "1rem" }}>Property</th>
                <th style={{ padding: "1rem" }}>Rent</th>
                <th style={{ padding: "1rem" }}>Term</th>
                <th style={{ padding: "1rem" }}>Status</th>
                <th style={{ padding: "1rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leases.map((lease) => {
                const statusStyle = STATUS_STYLES[lease.status] || STATUS_STYLES.draft;
                const startDate = new Date(lease.startDate).toLocaleDateString();
                const endDate = new Date(lease.endDate).toLocaleDateString();

                return (
                  <tr key={lease.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: "500" }}>{lease.tenantName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                        {lease.tenantEmail}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div>
                        {lease.propertyName}
                        {lease.unitNumber && ` - Unit ${lease.unitNumber}`}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                        {lease.propertyAddress}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "500" }}>
                      ${centsToDollars(lease.monthlyRent).toLocaleString()}/mo
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                      {startDate} - {endDate}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <Link
                        href={`/landlord/leases/${lease.id}`}
                        className="btn"
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.75rem",
                          border: "1px solid var(--border)",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--secondary)", marginBottom: "1rem" }}>
            No leases yet. Create a lease to start tracking tenant agreements.
          </p>
          <Link href="/landlord/leases/new" className="btn btn-primary">
            Create First Lease
          </Link>
        </div>
      )}
    </main>
  );
}
