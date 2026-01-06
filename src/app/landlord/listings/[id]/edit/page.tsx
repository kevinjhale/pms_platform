import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { getDb, units, properties } from "@/db";
import { eq } from "drizzle-orm";
import { updateListingStatus } from "@/services/listings";
import { centsToDollars } from "@/lib/utils";

async function getUnitWithProperty(unitId: string) {
  const db = getDb();
  const results = await db
    .select({
      id: units.id,
      unitNumber: units.unitNumber,
      bedrooms: units.bedrooms,
      bathrooms: units.bathrooms,
      sqft: units.sqft,
      rentAmount: units.rentAmount,
      status: units.status,
      description: units.description,
      propertyId: properties.id,
      propertyName: properties.name,
      address: properties.address,
      city: properties.city,
      state: properties.state,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(units.id, unitId))
    .limit(1);

  return results[0] || null;
}

export default async function EditListingPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const unit = await getUnitWithProperty(id);

  if (!unit) {
    notFound();
  }

  async function updateStatus(formData: FormData) {
    "use server";

    const status = formData.get("status") as
      | "available"
      | "occupied"
      | "maintenance"
      | "unlisted";

    await updateListingStatus(id, status);

    revalidatePath("/landlord/listings");
    redirect("/landlord/listings");
  }

  const title = unit.unitNumber
    ? `${unit.propertyName} - Unit ${unit.unitNumber}`
    : unit.propertyName;

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem", maxWidth: "600px" }}
    >
      <div className="card" style={{ padding: "2rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </h1>
        <p style={{ color: "var(--secondary)", marginBottom: "1.5rem" }}>
          {unit.address}, {unit.city}, {unit.state}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: "1rem",
            padding: "1rem",
            backgroundColor: "var(--surface)",
            borderRadius: "var(--radius)",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: "bold" }}>
              ${centsToDollars(unit.rentAmount).toLocaleString()}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
              /month
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: "bold" }}>{unit.bedrooms}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
              beds
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: "bold" }}>{unit.bathrooms}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
              baths
            </div>
          </div>
          {unit.sqft && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: "bold" }}>
                {unit.sqft.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                sqft
              </div>
            </div>
          )}
        </div>

        <form action={updateStatus}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Listing Status
            </label>
            <select
              name="status"
              defaultValue={unit.status}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                backgroundColor: "white",
                fontSize: "1rem",
              }}
            >
              <option value="available">Available - Listed publicly</option>
              <option value="unlisted">Unlisted - Hidden from search</option>
              <option value="occupied">Occupied - Currently rented</option>
              <option value="maintenance">Maintenance - Not rentable</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit" className="btn btn-primary">
              Save Status
            </button>
            <Link
              href={`/landlord/properties/${unit.propertyId}`}
              className="btn"
              style={{
                textDecoration: "none",
                border: "1px solid var(--border)",
              }}
            >
              Edit Unit Details
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
