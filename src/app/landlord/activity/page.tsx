import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { getAuditLogs, getActionLabel } from "@/services/audit";
import type { AuditEntityType } from "@/db/schema/audit";

const ENTITY_STYLES: Record<string, { bg: string; color: string }> = {
  property: { bg: "#dbeafe", color: "#1d4ed8" },
  unit: { bg: "#e0e7ff", color: "#4338ca" },
  application: { bg: "#fef3c7", color: "#92400e" },
  lease: { bg: "#d1fae5", color: "#047857" },
  payment: { bg: "#fce7f3", color: "#be185d" },
  maintenance: { bg: "#ffedd5", color: "#c2410c" },
  user: { bg: "#f3e8ff", color: "#7c3aed" },
  organization: { bg: "#e5e7eb", color: "#374151" },
  document: { bg: "#cffafe", color: "#0e7490" },
  settings: { bg: "#f1f5f9", color: "#64748b" },
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; page?: string }>;
}) {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const entityFilter = params.entity as AuditEntityType | undefined;
  const page = parseInt(params.page || "1", 10);
  const limit = 25;
  const offset = (page - 1) * limit;

  const logs = await getAuditLogs({
    organizationId: organization.id,
    entityType: entityFilter,
    limit: limit + 1, // Fetch one extra to check if there's more
    offset,
  });

  const hasMore = logs.length > limit;
  const displayLogs = logs.slice(0, limit);

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link
        href="/landlord"
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "var(--secondary)",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Activity Log</h1>
        <p style={{ color: "var(--secondary)" }}>
          Track all actions and changes across your organization.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link
          href="/landlord/activity"
          className="btn"
          style={{
            padding: "0.5rem 1rem",
            textDecoration: "none",
            backgroundColor: !entityFilter ? "var(--primary)" : "transparent",
            color: !entityFilter ? "white" : "inherit",
            border: "1px solid var(--border)",
          }}
        >
          All
        </Link>
        {["property", "unit", "application", "lease", "payment", "maintenance"].map((entity) => (
          <Link
            key={entity}
            href={`/landlord/activity?entity=${entity}`}
            className="btn"
            style={{
              padding: "0.5rem 1rem",
              textDecoration: "none",
              backgroundColor: entityFilter === entity ? "var(--primary)" : "transparent",
              color: entityFilter === entity ? "white" : "inherit",
              border: "1px solid var(--border)",
              textTransform: "capitalize",
            }}
          >
            {entity}
          </Link>
        ))}
      </div>

      {/* Activity List */}
      {displayLogs.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {displayLogs.map((log, index) => {
              const entityStyle = ENTITY_STYLES[log.entityType || "settings"] || ENTITY_STYLES.settings;
              return (
                <div
                  key={log.id}
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom: index < displayLogs.length - 1 ? "1px solid var(--border)" : "none",
                    display: "flex",
                    gap: "1rem",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Entity Badge */}
                  <div
                    style={{
                      minWidth: "90px",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      textAlign: "center",
                      textTransform: "uppercase",
                      backgroundColor: entityStyle.bg,
                      color: entityStyle.color,
                    }}
                  >
                    {log.entityType || "system"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
                      {log.description}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                      <span style={{ fontWeight: "500" }}>{getActionLabel(log.action)}</span>
                      {log.userEmail && <span> by {log.userEmail}</span>}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div style={{ fontSize: "0.75rem", color: "var(--secondary)", whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {(page > 1 || hasMore) && (
            <div
              style={{
                padding: "1rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                {page > 1 ? (
                  <Link
                    href={`/landlord/activity?${entityFilter ? `entity=${entityFilter}&` : ""}page=${page - 1}`}
                    className="btn"
                    style={{ padding: "0.5rem 1rem", textDecoration: "none", border: "1px solid var(--border)" }}
                  >
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
              </div>
              <span style={{ fontSize: "0.875rem", color: "var(--secondary)" }}>Page {page}</span>
              <div>
                {hasMore ? (
                  <Link
                    href={`/landlord/activity?${entityFilter ? `entity=${entityFilter}&` : ""}page=${page + 1}`}
                    className="btn"
                    style={{ padding: "0.5rem 1rem", textDecoration: "none", border: "1px solid var(--border)" }}
                  >
                    Next
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--secondary)" }}>
            {entityFilter
              ? `No ${entityFilter} activity recorded yet.`
              : "No activity recorded yet. Actions will appear here as you use the platform."}
          </p>
        </div>
      )}

      {/* Info Box */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius)",
          fontSize: "0.875rem",
          color: "var(--secondary)",
        }}
      >
        <strong>About Activity Logs</strong>
        <p style={{ margin: "0.5rem 0 0" }}>
          This log tracks all significant actions in your organization for compliance and auditing purposes.
          Logs are retained for the lifetime of your account.
        </p>
      </div>
    </main>
  );
}
