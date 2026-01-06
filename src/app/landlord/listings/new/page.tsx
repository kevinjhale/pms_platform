import Link from "next/link";

export default function NewListingPage() {
  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem", maxWidth: "600px" }}
    >
      <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>🏠</div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: "bold",
            marginBottom: "1rem",
          }}
        >
          Create a New Listing
        </h1>
        <p
          style={{
            color: "var(--secondary)",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}
        >
          Listings are created by adding units to your properties and setting
          their status to "Available". Go to your properties to add or manage
          units.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link
            href="/landlord/properties/new"
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            Add New Property
          </Link>
          <Link
            href="/landlord/properties"
            className="btn"
            style={{
              textDecoration: "none",
              border: "1px solid var(--border)",
            }}
          >
            View My Properties
          </Link>
        </div>
      </div>
    </main>
  );
}
