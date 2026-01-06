import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import {
  getMaintenanceRequestsByOrganization,
  getMaintenanceStats,
  type MaintenanceFilters,
} from "@/services/maintenance";
import { getPropertiesByOrganization, getUnitsByOrganization } from "@/services/properties";
import { archiveAllCompletedAction } from "@/app/actions/maintenance";
import { ArchiveAllCompletedButton } from "@/components/ArchiveAllCompletedButton";
import { MaintenanceFiltersForm } from "./MaintenanceFiltersForm";

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

type SearchParams = {
  status?: string;
  category?: string;
  priority?: string;
  propertyId?: string;
  unitId?: string;
  sortBy?: string;
  sortOrder?: string;
  showArchived?: string;
};

export default async function LandlordMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const showArchived = params.showArchived === "true";

  // Build filters from URL params
  const filters: MaintenanceFilters = {
    status: params.status,
    category: params.category,
    priority: params.priority,
    propertyId: params.propertyId,
    unitId: params.unitId,
    sortBy: (params.sortBy as MaintenanceFilters["sortBy"]) || "date",
    sortOrder: (params.sortOrder as MaintenanceFilters["sortOrder"]) || "desc",
    includeArchived: showArchived,
  };

  // Check if any filters are active (excluding default sort)
  const hasActiveFilters = !!(
    params.status ||
    params.category ||
    params.priority ||
    params.propertyId ||
    params.unitId ||
    (params.sortBy && params.sortBy !== "date") ||
    (params.sortOrder && params.sortOrder !== "desc")
  );

  const [requests, stats, properties, allUnits] = await Promise.all([
    getMaintenanceRequestsByOrganization(organization.id, undefined, filters),
    getMaintenanceStats(organization.id),
    getPropertiesByOrganization(organization.id),
    getUnitsByOrganization(organization.id),
  ]);

  // Filter units based on selected property for the dropdown
  const units = params.propertyId
    ? allUnits.filter((u) => u.propertyId === params.propertyId)
    : allUnits;

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Maintenance</h1>
          <p style={{ color: "var(--secondary)" }}>
            Manage maintenance requests from tenants.
          </p>
        </div>
        <Link
          href="/landlord/maintenance/new"
          className="btn btn-primary"
          style={{
            padding: "0.75rem 1.5rem",
            textDecoration: "none",
          }}
        >
          Create Ticket
        </Link>
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

      {/* Filters */}
      <MaintenanceFiltersForm
        currentFilters={params}
        properties={properties}
        units={units}
        allUnits={allUnits}
        hasActiveFilters={hasActiveFilters}
        showArchived={showArchived}
      />

      {/* Archive Controls */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginBottom: "1rem" }}>
        <ArchiveAllCompletedButton
          onArchiveAll={async () => {
            "use server";
            return await archiveAllCompletedAction();
          }}
        />
      </div>

      {/* Results count */}
      <div style={{ marginBottom: "1rem", color: "var(--secondary)", fontSize: "0.875rem" }}>
        Showing {requests.length} request{requests.length !== 1 ? "s" : ""}
        {hasActiveFilters && " (filtered)"}
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
                const isArchived = request.archived;
                return (
                  <tr
                    key={request.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      backgroundColor: isArchived ? "#f8fafc" : "transparent",
                      opacity: isArchived ? 0.7 : 1,
                    }}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: "500", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {request.title}
                        {isArchived && (
                          <span
                            style={{
                              fontSize: "0.625rem",
                              padding: "0.125rem 0.375rem",
                              backgroundColor: "#e2e8f0",
                              color: "#64748b",
                              borderRadius: "4px",
                              fontWeight: "500",
                            }}
                          >
                            Archived
                          </span>
                        )}
                      </div>
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
            {hasActiveFilters
              ? "No maintenance requests match your filters."
              : "No maintenance requests yet."}
          </p>
          {hasActiveFilters && (
            <Link
              href="/landlord/maintenance"
              className="btn"
              style={{
                marginTop: "1rem",
                display: "inline-block",
                padding: "0.5rem 1rem",
                border: "1px solid var(--border)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Clear Filters
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
