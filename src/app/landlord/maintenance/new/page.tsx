import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrgContext } from "@/lib/org-context";
import { getPropertiesByOrganization, getUnitsByProperty } from "@/services/properties";
import { createMaintenanceRequestAction } from "@/app/actions/maintenance";

const CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "appliance", label: "Appliance" },
  { value: "structural", label: "Structural" },
  { value: "pest", label: "Pest Control" },
  { value: "landscaping", label: "Landscaping" },
  { value: "cleaning", label: "Cleaning" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "emergency", label: "Emergency" },
];

type PropertyWithUnits = {
  id: string;
  name: string;
  address: string;
  units: Array<{
    id: string;
    unitNumber: string | null;
    bedrooms: number;
    bathrooms: number;
  }>;
};

export default async function NewMaintenanceRequestPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect("/onboarding");
  }

  // Get all properties and their units for the organization
  const properties = await getPropertiesByOrganization(organization.id);

  const propertiesWithUnits: PropertyWithUnits[] = await Promise.all(
    properties.map(async (property) => {
      const units = await getUnitsByProperty(property.id);
      return {
        id: property.id,
        name: property.name,
        address: property.address,
        units: units.map((u) => ({
          id: u.id,
          unitNumber: u.unitNumber,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
        })),
      };
    })
  );

  // Filter to only properties that have units
  const availableProperties = propertiesWithUnits.filter((p) => p.units.length > 0);

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem", maxWidth: "800px" }}
    >
      <Link
        href="/landlord/maintenance"
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "var(--secondary)",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        &larr; Back to Maintenance
      </Link>

      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem" }}>
        Create Maintenance Request
      </h1>

      {availableProperties.length === 0 ? (
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--secondary)", marginBottom: "1rem" }}>
            No properties with units found. Please add a property and units first.
          </p>
          <Link
            href="/landlord/properties/new"
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            Add Property
          </Link>
        </div>
      ) : (
        <form action={createMaintenanceRequestAction}>
          {/* Property & Unit Selection */}
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Property & Unit
            </h2>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Select Unit *
              </label>
              <select
                name="unitId"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  backgroundColor: "white",
                }}
              >
                <option value="">Choose a unit...</option>
                {availableProperties.map((property) => (
                  <optgroup key={property.id} label={`${property.name} - ${property.address}`}>
                    {property.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitNumber ? `Unit ${unit.unitNumber}` : "Main Unit"} ({unit.bedrooms}BR/{unit.bathrooms}BA)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Request Details */}
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Request Details
            </h2>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Title *
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="Brief summary of the issue"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Provide detailed information about the issue..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  Category *
                </label>
                <select
                  name="category"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  Priority *
                </label>
                <select
                  name="priority"
                  required
                  defaultValue="medium"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    backgroundColor: "white",
                  }}
                >
                  {PRIORITIES.map((pri) => (
                    <option key={pri.value} value={pri.value}>
                      {pri.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Access */}
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Access
            </h2>
            <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                name="permissionToEnter"
                style={{ width: "1.25rem", height: "1.25rem" }}
              />
              <span>
                Permission to enter unit if tenant is not present
              </span>
            </label>
            <p style={{ color: "var(--secondary)", fontSize: "0.75rem", marginTop: "0.5rem", marginLeft: "2rem" }}>
              Check this box if maintenance personnel may enter the unit when the tenant is not home.
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: "0.75rem 2rem" }}
            >
              Create Request
            </button>
            <Link
              href="/landlord/maintenance"
              className="btn"
              style={{
                padding: "0.75rem 2rem",
                textDecoration: "none",
                border: "1px solid var(--border)",
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
