import Link from "next/link";
import { getListingsByOrganization } from "@/services/listings";
import { getOrgContext } from "@/lib/org-context";
import { redirect } from "next/navigation";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  available: { bg: "#f0fdf4", color: "#15803d", label: "Available" },
  occupied: { bg: "#fef3c7", color: "#92400e", label: "Occupied" },
  maintenance: { bg: "#fee2e2", color: "#991b1b", label: "Maintenance" },
  unlisted: { bg: "#f1f5f9", color: "#64748b", label: "Unlisted" },
};

export default async function LandlordListings() {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  const listings = await getListingsByOrganization(organization.id);

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem" }}
    >
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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>My Listings</h1>
          <p style={{ color: "var(--secondary)" }}>
            Manage and monitor your property listings.
            {listings.length > 0 && ` ${listings.length} units total.`}
          </p>
        </div>
        <Link href="/landlord/properties" className="btn btn-primary">
          Manage Properties
        </Link>
      </div>

      {listings.length > 0 ? (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {listings.map((listing) => {
            const statusStyle = STATUS_STYLES[listing.status];
            return (
              <div
                key={listing.id}
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1.5rem",
                }}
              >
                <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                  <div
                    style={{
                      height: "80px",
                      width: "80px",
                      backgroundColor: "var(--border)",
                      borderRadius: "var(--radius)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    {listing.bedrooms}BR
                  </div>
                  <div>
                    <h3 style={{ marginBottom: "0.25rem" }}>{listing.title}</h3>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--secondary)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {listing.address}, {listing.city}, {listing.state}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        fontSize: "0.75rem",
                        color: "var(--secondary)",
                      }}
                    >
                      <span>${listing.price.toLocaleString()}/mo</span>
                      <span>{listing.bedrooms} bed</span>
                      <span>{listing.bathrooms} bath</span>
                      {listing.sqft && <span>{listing.sqft.toLocaleString()} sqft</span>}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                  }}
                >
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
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link
                      href={`/landlord/properties/${listing.propertyId}`}
                      className="btn"
                      style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.75rem",
                        border: "1px solid var(--border)",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      View Property
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: "3rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--secondary)", marginBottom: "1rem" }}>
            No units found. Add properties and units to start listing.
          </p>
          <Link href="/landlord/properties/new" className="btn btn-primary">
            Add Your First Property
          </Link>
        </div>
      )}
    </main>
  );
}
