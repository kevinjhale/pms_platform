import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getApplicationById,
  approveApplication,
  rejectApplication,
} from "@/services/applications";
import { auth } from "@/lib/auth";

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

export default async function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const application = await getApplicationById(id);

  if (!application) {
    notFound();
  }

  const statusStyle = STATUS_STYLES[application.status] || STATUS_STYLES.draft;
  const canDecide =
    application.status === "submitted" ||
    application.status === "under_review";

  async function approve() {
    "use server";
    const appSession = await auth();
    if (!appSession?.user?.id) return;

    await approveApplication(id, appSession.user.id);
    revalidatePath(`/landlord/applications/${id}`);
    revalidatePath("/landlord/applications");
  }

  async function reject() {
    "use server";
    const appSession = await auth();
    if (!appSession?.user?.id) return;

    await rejectApplication(id, appSession.user.id);
    revalidatePath(`/landlord/applications/${id}`);
    revalidatePath("/landlord/applications");
  }

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem", maxWidth: "900px" }}
    >
      <Link
        href="/landlord/applications"
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "var(--secondary)",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        &larr; Back to applications
      </Link>

      {/* Header */}
      <div
        className="card"
        style={{
          padding: "1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
            {application.firstName} {application.lastName}
          </h1>
          <p style={{ color: "var(--secondary)" }}>{application.applicantEmail}</p>
        </div>
        <span
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "20px",
            fontSize: "0.875rem",
            fontWeight: "600",
            backgroundColor: statusStyle.bg,
            color: statusStyle.color,
          }}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Property Info */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
          Applied For
        </h2>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: "500" }}>{application.unitTitle}</div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>
              {application.propertyAddress}
            </div>
          </div>
          <div style={{ textAlign: "right", color: "var(--secondary)", fontSize: "0.875rem" }}>
            Applied on{" "}
            {application.submittedAt
              ? new Date(application.submittedAt).toLocaleDateString()
              : "-"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Personal Info */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Personal Information
          </h2>
          <dl style={{ display: "grid", gap: "0.75rem" }}>
            <div>
              <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Phone</dt>
              <dd style={{ fontWeight: "500" }}>{application.phone || "-"}</dd>
            </div>
            <div>
              <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Date of Birth</dt>
              <dd style={{ fontWeight: "500" }}>{application.dateOfBirth || "-"}</dd>
            </div>
          </dl>
        </div>

        {/* Employment */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Employment
          </h2>
          <dl style={{ display: "grid", gap: "0.75rem" }}>
            <div>
              <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Employer</dt>
              <dd style={{ fontWeight: "500" }}>{application.employer || "-"}</dd>
            </div>
            <div>
              <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Job Title</dt>
              <dd style={{ fontWeight: "500" }}>{application.jobTitle || "-"}</dd>
            </div>
            <div>
              <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                Monthly Income
              </dt>
              <dd style={{ fontWeight: "500" }}>
                {application.monthlyIncome
                  ? `$${application.monthlyIncome.toLocaleString()}`
                  : "-"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Current Residence */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Current Residence
          </h2>
          <dl style={{ display: "grid", gap: "0.75rem" }}>
            <div>
              <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Address</dt>
              <dd style={{ fontWeight: "500" }}>
                {application.currentAddress || "-"}
                {application.currentCity && (
                  <>
                    <br />
                    {application.currentCity}, {application.currentState}{" "}
                    {application.currentZip}
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                Current Rent
              </dt>
              <dd style={{ fontWeight: "500" }}>
                {application.currentRent
                  ? `$${application.currentRent.toLocaleString()}/mo`
                  : "-"}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                Current Landlord
              </dt>
              <dd style={{ fontWeight: "500" }}>
                {application.currentLandlord || "-"}
                {application.currentLandlordPhone && (
                  <span style={{ color: "var(--secondary)", marginLeft: "0.5rem" }}>
                    ({application.currentLandlordPhone})
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Additional Info */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Additional Info
          </h2>
          <dl style={{ display: "grid", gap: "0.75rem" }}>
            <div>
              <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Pets</dt>
              <dd style={{ fontWeight: "500" }}>
                {application.hasPets ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                Background Check Consent
              </dt>
              <dd style={{ fontWeight: "500" }}>
                {application.backgroundCheckConsent ? "Authorized" : "Not authorized"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Decision Area */}
      {canDecide && (
        <div
          className="card"
          style={{
            padding: "1.5rem",
            marginTop: "1.5rem",
            backgroundColor: "var(--surface)",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Decision
          </h2>
          <div style={{ display: "flex", gap: "1rem" }}>
            <form action={approve}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "0.75rem 2rem" }}
              >
                Approve Application
              </button>
            </form>
            <form action={reject}>
              <button
                type="submit"
                className="btn"
                style={{
                  padding: "0.75rem 2rem",
                  border: "1px solid var(--error)",
                  color: "var(--error)",
                }}
              >
                Reject Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Decision Notes */}
      {(application.status === "approved" || application.status === "rejected") &&
        application.decidedAt && (
          <div
            className="card"
            style={{
              padding: "1.5rem",
              marginTop: "1.5rem",
              backgroundColor:
                application.status === "approved" ? "#f0fdf4" : "#fee2e2",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              {application.status === "approved" ? "Approved" : "Rejected"} on{" "}
              {new Date(application.decidedAt).toLocaleDateString()}
            </h2>
            {application.decisionNotes && (
              <p style={{ color: "var(--secondary)" }}>{application.decisionNotes}</p>
            )}
          </div>
        )}
    </main>
  );
}
