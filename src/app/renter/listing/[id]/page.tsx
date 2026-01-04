import { getPublicListingById } from "@/services/listings";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getPublicListingById(id);

  if (!listing) {
    notFound();
  }

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem", maxWidth: "800px" }}
    >
      <Link
        href="/renter/browse"
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "var(--secondary)",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        &larr; Back to listings
      </Link>

      <div className="card" style={{ padding: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          {listing.title}
        </h1>
        <p style={{ color: "var(--secondary)", marginBottom: "1.5rem" }}>
          {listing.address}, {listing.city}, {listing.state}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
            padding: "1.5rem",
            backgroundColor: "var(--surface)",
            borderRadius: "var(--radius)",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)" }}
            >
              ${listing.price.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--secondary)" }}>
              per month
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {listing.bedrooms}
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--secondary)" }}>
              bedrooms
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {listing.bathrooms}
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--secondary)" }}>
              bathrooms
            </div>
          </div>
          {listing.sqft && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {listing.sqft.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--secondary)" }}>
                sqft
              </div>
            </div>
          )}
        </div>

        {listing.description && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.75rem" }}>
              Description
            </h2>
            <p style={{ color: "var(--secondary)", lineHeight: 1.6 }}>
              {listing.description}
            </p>
          </div>
        )}

        {listing.features && listing.features.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.75rem" }}>
              Features
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {listing.features.map((feature, i) => (
                <span
                  key={i}
                  style={{
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                  }}
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {listing.availableDate && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.75rem" }}>
              Availability
            </h2>
            <p style={{ color: "var(--secondary)" }}>
              Available from {new Date(listing.availableDate).toLocaleDateString()}
            </p>
          </div>
        )}

        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
          <Link
            href={`/renter/apply/${listing.id}`}
            className="btn btn-primary"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              textDecoration: "none",
            }}
          >
            Apply for this listing
          </Link>
        </div>
      </div>
    </main>
  );
}
