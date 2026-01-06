import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  getMaintenanceRequestById,
  getMaintenanceComments,
  updateMaintenanceStatus,
  completeMaintenanceRequest,
  addMaintenanceComment,
} from "@/services/maintenance";
import {
  archiveMaintenanceRequestAction,
  unarchiveMaintenanceRequestAction,
} from "@/app/actions/maintenance";
import { centsToDollars } from "@/lib/utils";
import { ArchiveMaintenanceButton } from "@/components/ArchiveMaintenanceButton";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  open: { bg: "#fee2e2", color: "#991b1b", label: "Open" },
  acknowledged: { bg: "#fff7ed", color: "#9a3412", label: "Acknowledged" },
  in_progress: { bg: "#eff6ff", color: "#1d4ed8", label: "In Progress" },
  pending_parts: { bg: "#fef3c7", color: "#92400e", label: "Pending Parts" },
  completed: { bg: "#f0fdf4", color: "#15803d", label: "Completed" },
  cancelled: { bg: "#f1f5f9", color: "#64748b", label: "Cancelled" },
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

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const request = await getMaintenanceRequestById(id);
  if (!request) {
    notFound();
  }

  const comments = await getMaintenanceComments(id, true); // Include internal comments
  const statusStyle = STATUS_STYLES[request.status] || STATUS_STYLES.open;
  const isOpen = request.status !== "completed" && request.status !== "cancelled";

  async function changeStatus(formData: FormData) {
    "use server";
    const newStatus = formData.get("status") as string;
    await updateMaintenanceStatus(id, newStatus as any);
    revalidatePath(`/landlord/maintenance/${id}`);
  }

  async function markComplete(formData: FormData) {
    "use server";
    const reqSession = await auth();
    if (!reqSession?.user?.id) return;

    const resolutionSummary = formData.get("resolutionSummary") as string;
    const actualCost = formData.get("actualCost")
      ? Math.round(parseFloat(formData.get("actualCost") as string) * 100)
      : undefined;
    const hoursSpent = formData.get("hoursSpent")
      ? parseFloat(formData.get("hoursSpent") as string)
      : undefined;

    await completeMaintenanceRequest(id, reqSession.user.id, resolutionSummary, actualCost, hoursSpent);
    revalidatePath(`/landlord/maintenance/${id}`);
    revalidatePath("/landlord/maintenance");
  }

  async function addComment(formData: FormData) {
    "use server";
    const reqSession = await auth();
    if (!reqSession?.user?.id) return;

    const content = formData.get("content") as string;
    const isInternal = formData.get("isInternal") === "on";

    await addMaintenanceComment(id, reqSession.user.id, content, isInternal);
    revalidatePath(`/landlord/maintenance/${id}`);
  }

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem", maxWidth: "900px" }}
    >
      <Link
        href="/landlord/maintenance"
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "var(--secondary)",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        &larr; Back to maintenance
      </Link>

      {/* Header */}
      <div
        className="card"
        style={{
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{request.title}</h1>
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
            </div>
            <p style={{ color: "var(--secondary)" }}>
              {request.propertyName}
              {request.unitNumber && ` - Unit ${request.unitNumber}`}
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: "0.875rem", color: "var(--secondary)" }}>
            <div>Created {new Date(request.createdAt).toLocaleDateString()}</div>
            <div>by {request.requestedByName}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        <div>
          {/* Description */}
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>
              Description
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{request.description}</p>
          </div>

          {/* Comments */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>
              Activity
            </h2>

            {comments.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      padding: "0.75rem",
                      backgroundColor: comment.isInternal ? "#fef3c7" : "var(--surface)",
                      borderRadius: "var(--radius)",
                      borderLeft: comment.isInternal ? "3px solid #f59e0b" : "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: "500", fontSize: "0.875rem" }}>
                        {comment.authorName}
                        {comment.isInternal && (
                          <span style={{ color: "#92400e", marginLeft: "0.5rem", fontSize: "0.75rem" }}>
                            (Internal)
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.875rem" }}>{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--secondary)", marginBottom: "1.5rem" }}>No comments yet.</p>
            )}

            {isOpen && (
              <form action={addComment}>
                <textarea
                  name="content"
                  required
                  rows={3}
                  placeholder="Add a comment..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    marginBottom: "0.75rem",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                    <input type="checkbox" name="isInternal" />
                    Internal note (hidden from tenant)
                  </label>
                  <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>
                    Add Comment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div>
          {/* Details */}
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>
              Details
            </h2>
            <dl style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Category</dt>
                <dd style={{ fontWeight: "500" }}>
                  {CATEGORY_LABELS[request.category] || request.category}
                </dd>
              </div>
              <div>
                <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Priority</dt>
                <dd
                  style={{
                    fontWeight: "500",
                    color:
                      request.priority === "emergency"
                        ? "#991b1b"
                        : request.priority === "high"
                        ? "#dc2626"
                        : "inherit",
                  }}
                >
                  {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                </dd>
              </div>
              <div>
                <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Permission to Enter</dt>
                <dd style={{ fontWeight: "500" }}>
                  {request.permissionToEnter ? "Yes" : "No"}
                </dd>
              </div>
              {request.estimatedCost && (
                <div>
                  <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Estimated Cost</dt>
                  <dd style={{ fontWeight: "500" }}>
                    ${centsToDollars(request.estimatedCost).toLocaleString()}
                  </dd>
                </div>
              )}
              {request.actualCost && (
                <div>
                  <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Actual Cost</dt>
                  <dd style={{ fontWeight: "500" }}>
                    ${centsToDollars(request.actualCost).toLocaleString()}
                  </dd>
                </div>
              )}
              {request.hoursSpent != null && (
                <div>
                  <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Hours Spent</dt>
                  <dd style={{ fontWeight: "500" }}>
                    {request.hoursSpent}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions */}
          {isOpen && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>
                Actions
              </h2>

              {/* Status Change */}
              <form action={changeStatus} style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  Update Status
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    name="status"
                    defaultValue={request.status}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending_parts">Pending Parts</option>
                  </select>
                  <button type="submit" className="btn" style={{ border: "1px solid var(--border)" }}>
                    Update
                  </button>
                </div>
              </form>

              {/* Complete */}
              <form action={markComplete}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  Resolution Summary
                </label>
                <textarea
                  name="resolutionSummary"
                  required
                  rows={2}
                  placeholder="What was done to resolve this..."
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    marginBottom: "0.5rem",
                  }}
                />
                <div style={{ marginBottom: "0.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                    Hours Spent
                  </label>
                  <input
                    name="hoursSpent"
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                    Actual Cost ($)
                  </label>
                  <input
                    name="actualCost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  Mark Complete
                </button>
              </form>
            </div>
          )}

          {/* Completion Info */}
          {request.status === "completed" && request.completedAt && (
            <div
              className="card"
              style={{ padding: "1.5rem", backgroundColor: "#f0fdf4" }}
            >
              <h2 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem", color: "#15803d" }}>
                Completed
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--secondary)", marginBottom: "0.5rem" }}>
                {new Date(request.completedAt).toLocaleDateString()}
              </p>
              {request.resolutionSummary && (
                <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>{request.resolutionSummary}</p>
              )}
              {request.hoursSpent != null && (
                <p style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                  Hours spent: {request.hoursSpent}
                </p>
              )}
            </div>
          )}

          {/* Archive/Unarchive */}
          {(request.status === "completed" || request.status === "cancelled") && (
            <div className="card" style={{ padding: "1.5rem", marginTop: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>
                Archive
              </h2>
              {request.archived && request.archivedAt && (
                <p style={{ fontSize: "0.75rem", color: "var(--secondary)", marginBottom: "0.75rem" }}>
                  Archived on {new Date(request.archivedAt).toLocaleDateString()}
                </p>
              )}
              <ArchiveMaintenanceButton
                isArchived={request.archived ?? false}
                onArchive={async () => {
                  "use server";
                  await archiveMaintenanceRequestAction(id);
                }}
                onUnarchive={async () => {
                  "use server";
                  await unarchiveMaintenanceRequestAction(id);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
