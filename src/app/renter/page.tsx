import Link from "next/link";
import { auth } from "@/lib/auth";
import { getLeasesByTenant, getPaymentsByLease } from "@/services/leases";
import { getApplicationsByApplicant } from "@/services/applications";
import { centsToDollars } from "@/lib/utils";

export default async function RenterDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  let activeLease = null;
  let nextPayment = null;
  let applications: Awaited<ReturnType<typeof getApplicationsByApplicant>> = [];

  if (userId) {
    const leases = await getLeasesByTenant(userId);
    activeLease = leases.find((l) => l.status === "active") || null;

    if (activeLease) {
      const payments = await getPaymentsByLease(activeLease.id);
      nextPayment = payments.find(
        (p) => p.status === "upcoming" || p.status === "due"
      );
    }

    applications = await getApplicationsByApplicant(userId);
  }

  const pendingApps = applications.filter(
    (a) => a.status === "submitted" || a.status === "under_review"
  );

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <h1 style={{ marginBottom: "2rem" }}>Renter Dashboard</h1>

      {/* Active Lease Banner */}
      {activeLease && (
        <div
          className="card"
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            backgroundColor: "var(--surface)",
            border: "2px solid var(--primary)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                Current Lease
              </h2>
              <div style={{ fontWeight: "500" }}>
                {activeLease.propertyName}
                {activeLease.unitNumber && ` - Unit ${activeLease.unitNumber}`}
              </div>
              <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>
                {activeLease.propertyAddress}
              </div>
              <div style={{ color: "var(--secondary)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Lease ends: {new Date(activeLease.endDate).toLocaleDateString()}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                ${centsToDollars(activeLease.monthlyRent).toLocaleString()}
              </div>
              <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>per month</div>
              {nextPayment && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    backgroundColor:
                      nextPayment.status === "due" ? "#fff7ed" : "#f0fdf4",
                    color: nextPayment.status === "due" ? "#9a3412" : "#15803d",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                  }}
                >
                  {nextPayment.status === "due" ? "Due now" : "Next payment"}: $
                  {centsToDollars(nextPayment.amountDue).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Search Listings */}
        <div className="card">
          <h3
            style={{
              fontSize: "1.5rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Find Your Home
          </h3>
          <p style={{ color: "var(--secondary)", marginBottom: "1.5rem" }}>
            Browse available listings and find your next home.
          </p>
          <Link
            href="/renter/browse"
            className="btn btn-primary"
            style={{ width: "100%", textAlign: "center", textDecoration: "none" }}
          >
            Browse Listings
          </Link>
        </div>

        {/* Applications */}
        <div className="card">
          <h3
            style={{
              fontSize: "1.5rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            My Applications
          </h3>
          <p style={{ color: "var(--secondary)", marginBottom: "1rem" }}>
            Track your rental applications.
          </p>
          {pendingApps.length > 0 ? (
            <div style={{ marginBottom: "1rem" }}>
              {pendingApps.slice(0, 2).map((app) => (
                <div
                  key={app.id}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--radius)",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <div style={{ fontWeight: "500" }}>{app.unitTitle}</div>
                  <div style={{ color: "var(--secondary)", fontSize: "0.75rem" }}>
                    {app.status === "submitted" ? "Awaiting review" : "Under review"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              No pending applications.
            </p>
          )}
          <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>
            {applications.length} total application{applications.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </main>
  );
}
