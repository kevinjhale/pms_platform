import { getPublicListings } from "@/services/listings";
import Link from "next/link";

export default async function RenterBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.query || "";
  const currentPage = parseInt(params.page || "1", 10);
  const pageSize = 10;

  const { listings, total } = await getPublicListings({
    query: query || undefined,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem" }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          Browse Listings
        </h1>
        <p style={{ color: "var(--secondary)" }}>
          Find your next home from our verified properties.
          {total > 0 && ` ${total} listings available.`}
        </p>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
        <form
          action="/renter/browse"
          method="GET"
          style={{ display: "flex", gap: "1rem" }}
        >
          <input
            name="query"
            defaultValue={query}
            placeholder="Search by city, address, or building name..."
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--background)",
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "0 2rem" }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Listings Grid */}
      {listings.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="card"
              style={{ padding: "1.5rem" }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                  {listing.title}
                </h3>
                <p
                  style={{
                    color: "var(--secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  {listing.address}, {listing.city}, {listing.state}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                  color: "var(--secondary)",
                }}
              >
                <span>{listing.bedrooms} bed</span>
                <span>{listing.bathrooms} bath</span>
                {listing.sqft && <span>{listing.sqft.toLocaleString()} sqft</span>}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: "600", fontSize: "1.25rem" }}>
                  ${listing.price.toLocaleString()}
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "normal",
                      color: "var(--secondary)",
                    }}
                  >
                    /mo
                  </span>
                </div>
                <Link
                  href={`/renter/listing/${listing.id}`}
                  className="btn btn-primary"
                  style={{
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    textDecoration: "none",
                  }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "var(--secondary)",
          }}
        >
          {query
            ? "No listings found matching your search."
            : "No listings available at this time. Check back soon!"}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`/renter/browse?query=${query}&page=${pageNum}`}
              className="btn"
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid var(--border)",
                backgroundColor:
                  currentPage === pageNum ? "var(--primary)" : "transparent",
                color: currentPage === pageNum ? "white" : "inherit",
                textDecoration: "none",
              }}
            >
              {pageNum}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
