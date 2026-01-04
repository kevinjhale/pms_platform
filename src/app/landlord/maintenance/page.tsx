import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import {
  getMaintenanceRequestsByOrganization,
  getMaintenanceStats,
} from "@/services/maintenance";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  open: { bg: "#fee2e2", color: "#991b1b", label: "Open" },
  acknowledged: { bg: "#fff7ed", color: "#9a3412", label: "Acknowledged" },
  in_progress: { bg: "#eff6ff", color: "#1d4ed8", label: "In Progress" },
  pending_parts: { bg: "#fef3c7", color: "#92400e", label: "Pending Parts" },
  completed: { bg: "#f0fdf4", color: "#15803d", label: "Completed" },
  cancelled: { bg: "#f1f5f9", color: "#64748b", label: "Cancelled" },
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  emergency: "EMERGENCY",
};

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

export default async function LandlordMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const statusFilter = params.status;

  const requests = await getMaintenanceRequestsByOrganization(
    organization.id,
    statusFilter
  );
  const stats = await getMaintenanceStats(organization.id);

  const openRequests = requests.filter(
    (r) => r.status === "open" || r.status === "acknowledged"
  );
  const inProgressRequests = requests.filter(
    (r) => r.status === "in_progress" || r.status === "pending_parts"
  );

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Maintenance</h1>
        <p style={{ color: "var(--secondary)" }}>
          Manage maintenance requests from tenants.
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#991b1b" }}>
            {stats.open}
          </div>
          <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Open</div>
        </div>
        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1d4ed8" }}>
            {stats.inProgress}
          </div>
          <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>In Progress</div>
        </div>
        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d" }}>
            {stats.completed}
          </div>
          <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Completed</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <Link
          href="/landlord/maintenance"
          className="btn"
          style={{
            padding: "0.5rem 1rem",
            textDecoration: "none",
            backgroundColor: !statusFilter ? "var(--primary)" : "transparent",
            color: !statusFilter ? "white" : "inherit",
            border: "1px solid var(--border)",
          }}
        >
          All
        </Link>
        <Link
          href="/landlord/maintenance?status=open"
          className="btn"
          style={{
            padding: "0.5rem 1rem",
            textDecoration: "none",
            backgroundColor: statusFilter === "open" ? "var(--primary)" : "transparent",
            color: statusFilter === "open" ? "white" : "inherit",
            border: "1px solid var(--border)",
          }}
        >
          Open
        </Link>
        <Link
          href="/landlord/maintenance?status=in_progress"
          className="btn"
          style={{
            padding: "0.5rem 1rem",
            textDecoration: "none",
            backgroundColor: statusFilter === "in_progress" ? "var(--primary)" : "transparent",
            color: statusFilter === "in_progress" ? "white" : "inherit",
            border: "1px solid var(--border)",
          }}
        >
          In Progress
        </Link>
        <Link
          href="/landlord/maintenance?status=completed"
          className="btn"
          style={{
            padding: "0.5rem 1rem",
            textDecoration: "none",
            backgroundColor: statusFilter === "completed" ? "var(--primary)" : "transparent",
            color: statusFilter === "completed" ? "white" : "inherit",
            border: "1px solid var(--border)",
          }}
        >
          Completed
        </Link>
      </div>

      {/* Requests List */}
      {requests.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--surface)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <th style={{ padding: "1rem" }}>Request</th>
                <th style={{ padding: "1rem" }}>Property</th>
                <th style={{ padding: "1rem" }}>Category</th>
                <th style={{ padding: "1rem" }}>Priority</th>
                <th style={{ padding: "1rem" }}>Status</th>
                <th style={{ padding: "1rem" }}>Created</th>
                <th style={{ padding: "1rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const statusStyle = STATUS_STYLES[request.status] || STATUS_STYLES.open;
                return (
                  <tr key={request.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: "500" }}>{request.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                        by {request.requestedByName}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div>{request.propertyName}</div>
                      {request.unitNumber && (
                        <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                          Unit {request.unitNumber}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                      {CATEGORY_LABELS[request.category] || request.category}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          fontWeight: request.priority === "emergency" ? "bold" : "normal",
                          color:
                            request.priority === "emergency"
                              ? "#991b1b"
                              : request.priority === "high"
                              ? "#dc2626"
                              : "inherit",
                        }}
                      >
                        {PRIORITY_LABELS[request.priority]}
                      </span>
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
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--secondary)" }}>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <Link
                        href={`/landlord/maintenance/${request.id}`}
                        className="btn"
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.75rem",
                          border: "1px solid var(--border)",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        Manage
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
          <p style={{ color: "var(--secondary)" }}>
            {statusFilter
              ? `No ${statusFilter.replace("_", " ")} maintenance requests.`
              : "No maintenance requests yet."}
          </p>
        </div>
      )}
    </main>
  );
}
