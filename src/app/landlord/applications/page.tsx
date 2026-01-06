import Link from "next/link";
import { getApplicationsByOrganization } from "@/services/applications";
import { getOrgContext } from "@/lib/org-context";
import { redirect } from "next/navigation";

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  draft: { bg: "#f1f5f9", color: "#64748b", label: "Draft" },
  submitted: { bg: "#eff6ff", color: "#1d4ed8", label: "Submitted" },
  under_review: { bg: "#fff7ed", color: "#9a3412", label: "Under Review" },
  approved: { bg: "#f0fdf4", color: "#15803d", label: "Approved" },
  rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
  withdrawn: { bg: "#f1f5f9", color: "#64748b", label: "Withdrawn" },
};

export default async function LandlordApplications() {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  const applications = await getApplicationsByOrganization(organization.id);

  // Filter out drafts - landlords only see submitted applications
  const visibleApplications = applications.filter(
    (app) => app.status !== "draft"
  );

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem" }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
          Application Portal
        </h1>
        <p style={{ color: "var(--secondary)" }}>
          Review and manage rental applications.
          {visibleApplications.length > 0 &&
            ` ${visibleApplications.length} applications.`}
        </p>
      </div>

      {visibleApplications.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--surface)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <th style={{ padding: "1rem" }}>Applicant</th>
                <th style={{ padding: "1rem" }}>Property</th>
                <th style={{ padding: "1rem" }}>Status</th>
                <th style={{ padding: "1rem" }}>Applied</th>
                <th style={{ padding: "1rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleApplications.map((app) => {
                const statusStyle = STATUS_STYLES[app.status] || STATUS_STYLES.draft;
                return (
                  <tr
                    key={app.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: "500" }}>
                        {app.firstName && app.lastName
                          ? `${app.firstName} ${app.lastName}`
                          : app.applicantName}
                      </div>
                      <div
                        style={{ fontSize: "0.75rem", color: "var(--secondary)" }}
                      >
                        {app.applicantEmail}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div>{app.unitTitle}</div>
                      <div
                        style={{ fontSize: "0.75rem", color: "var(--secondary)" }}
                      >
                        {app.propertyAddress}
                      </div>
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
                    <td
                      style={{ padding: "1rem", color: "var(--secondary)" }}
                    >
                      {app.submittedAt
                        ? new Date(app.submittedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <Link
                        href={`/landlord/applications/${app.id}`}
                        className="btn"
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.75rem",
                          border: "1px solid var(--border)",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="card"
          style={{ padding: "3rem", textAlign: "center" }}
        >
          <p style={{ color: "var(--secondary)", marginBottom: "1rem" }}>
            No applications received yet. Applications will appear here when
            renters apply for your listings.
          </p>
          <Link
            href="/landlord/listings"
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            Manage Listings
          </Link>
        </div>
      )}
    </main>
  );
}
