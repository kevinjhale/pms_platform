import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getLeasesByTenant } from "@/services/leases";
import {
  createMaintenanceRequest,
  getMaintenanceRequestsByTenant,
} from "@/services/maintenance";
import { logMaintenanceAction, buildAuditContext } from "@/services/audit";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  open: { bg: "#fee2e2", color: "#991b1b", label: "Open" },
  acknowledged: { bg: "#fff7ed", color: "#9a3412", label: "Acknowledged" },
  in_progress: { bg: "#eff6ff", color: "#1d4ed8", label: "In Progress" },
  pending_parts: { bg: "#fef3c7", color: "#92400e", label: "Pending Parts" },
  completed: { bg: "#f0fdf4", color: "#15803d", label: "Completed" },
  cancelled: { bg: "#f1f5f9", color: "#64748b", label: "Cancelled" },
};

const PRIORITY_STYLES: Record<string, { color: string }> = {
  low: { color: "#64748b" },
  medium: { color: "#9a3412" },
  high: { color: "#dc2626" },
  emergency: { color: "#7c2d12" },
};

export default async function RenterMaintenancePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const leases = await getLeasesByTenant(session.user.id);
  const activeLease = leases.find((l) => l.status === "active");
  const requests = await getMaintenanceRequestsByTenant(session.user.id);

  const openRequests = requests.filter(
    (r) => r.status !== "completed" && r.status !== "cancelled"
  );

  async function submitRequest(formData: FormData) {
    "use server";

    const reqSession = await auth();
    if (!reqSession?.user?.id) return;

    const userLeases = await getLeasesByTenant(reqSession.user.id);
    const lease = userLeases.find((l) => l.status === "active");
    if (!lease) return;

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const priority = formData.get("priority") as string;
    const permissionToEnter = formData.get("permissionToEnter") === "on";

    const request = await createMaintenanceRequest({
      unitId: lease.unitId,
      leaseId: lease.id,
      requestedBy: reqSession.user.id,
      title,
      description,
      category: category as any,
      priority: priority as any,
      permissionToEnter,
      status: "open",
    });

    // Log the action for audit trail
    await logMaintenanceAction(
      buildAuditContext(reqSession, lease.organizationId),
      "maintenance.created",
      request.id,
      title,
      { category, priority, unitId: lease.unitId }
    );

    revalidatePath("/renter/maintenance");
  }

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
        Maintenance Requests
      </h1>
      <p style={{ color: "var(--secondary)", marginBottom: "2rem" }}>
        Submit and track maintenance requests for your unit.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Submit New Request */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Submit New Request
          </h2>

          {activeLease ? (
            <form action={submitRequest}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  Issue Title *
                </label>
                <input
                  name="title"
                  required
                  placeholder="Brief description of the issue"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC / Heating / Cooling</option>
                    <option value="appliance">Appliance</option>
                    <option value="structural">Structural / Doors / Windows</option>
                    <option value="pest">Pest Control</option>
                    <option value="security">Security / Locks</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                    Priority *
                  </label>
                  <select
                    name="priority"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="low">Low - Can wait</option>
                    <option value="medium">Medium - Soon</option>
                    <option value="high">High - Urgent</option>
                    <option value="emergency">Emergency - Safety issue</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Please describe the issue in detail..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.875rem" }}>
                  <input type="checkbox" name="permissionToEnter" />
                  Permission to enter unit if I'm not home
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                Submit Request
              </button>
            </form>
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--secondary)" }}>
              <p>You need an active lease to submit maintenance requests.</p>
            </div>
          )}
        </div>

        {/* Request History */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Your Requests
            {openRequests.length > 0 && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                }}
              >
                {openRequests.length} open
              </span>
            )}
          </h2>

          {requests.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {requests.slice(0, 10).map((request) => {
                const statusStyle = STATUS_STYLES[request.status] || STATUS_STYLES.open;
                const priorityStyle = PRIORITY_STYLES[request.priority] || PRIORITY_STYLES.medium;
                return (
                  <div
                    key={request.id}
                    style={{
                      padding: "1rem",
                      backgroundColor: "var(--surface)",
                      borderRadius: "var(--radius)",
                      borderLeft: `3px solid ${priorityStyle.color}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <div style={{ fontWeight: "500" }}>{request.title}</div>
                      <span
                        style={{
                          padding: "0.125rem 0.5rem",
                          borderRadius: "12px",
                          fontSize: "0.7rem",
                          fontWeight: "600",
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {statusStyle.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                      {request.category} - {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--secondary)" }}>
              No maintenance requests yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
