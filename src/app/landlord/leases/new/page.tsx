import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrgContext } from "@/lib/org-context";
import { getListingsByOrganization } from "@/services/listings";
import { createLease, generateMonthlyPayments } from "@/services/leases";
import { dollarsToCents } from "@/lib/utils";

export default async function NewLeasePage() {
  const { organization } = await getOrgContext();

  if (!organization) {
    redirect("/onboarding");
  }

  // Get available units (not occupied)
  const allUnits = await getListingsByOrganization(organization.id);
  const availableUnits = allUnits.filter(
    (u) => u.status === "available" || u.status === "unlisted"
  );

  async function createLeaseAction(formData: FormData) {
    "use server";

    const unitId = formData.get("unitId") as string;
    const tenantEmail = formData.get("tenantEmail") as string;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const monthlyRent = dollarsToCents(parseFloat(formData.get("monthlyRent") as string));
    const securityDeposit = formData.get("securityDeposit")
      ? dollarsToCents(parseFloat(formData.get("securityDeposit") as string))
      : null;
    const lateFeeAmount = formData.get("lateFeeAmount")
      ? dollarsToCents(parseFloat(formData.get("lateFeeAmount") as string))
      : null;
    const lateFeeGraceDays = parseInt(formData.get("lateFeeGraceDays") as string) || 5;
    const petPolicy = formData.get("petPolicy") as string;
    const terms = formData.get("terms") as string;

    // Look up tenant by email or create placeholder
    const { getDb, users } = await import("@/db");
    const { eq } = await import("drizzle-orm");
    const { generateId, now } = await import("@/lib/utils");

    const db = getDb();
    let tenantResult = await db
      .select()
      .from(users)
      .where(eq(users.email, tenantEmail.toLowerCase()))
      .limit(1);

    let tenantId: string;
    if (tenantResult.length === 0) {
      // Create placeholder user for tenant
      tenantId = generateId();
      const timestamp = now();
      await db.insert(users).values({
        id: tenantId,
        email: tenantEmail.toLowerCase(),
        name: tenantEmail.split("@")[0],
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    } else {
      tenantId = tenantResult[0].id;
    }

    const lease = await createLease({
      unitId,
      tenantId,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      lateFeeAmount,
      lateFeeGraceDays,
      petPolicy: petPolicy as any,
      terms: terms || null,
      status: "pending",
    });

    // Generate rent payment schedule
    await generateMonthlyPayments(lease.id);

    revalidatePath("/landlord/leases");
    redirect("/landlord/leases");
  }

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem", maxWidth: "800px" }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem" }}>
        Create New Lease
      </h1>

      <form action={createLeaseAction}>
        {/* Unit Selection */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Property & Unit
          </h2>
          <div>
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
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title} - ${unit.price.toLocaleString()}/mo ({unit.bedrooms}BR/{unit.bathrooms}BA)
                </option>
              ))}
            </select>
            {availableUnits.length === 0 && (
              <p style={{ color: "var(--secondary)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                No available units. Mark a unit as "available" first.
              </p>
            )}
          </div>
        </div>

        {/* Tenant Info */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Tenant Information
          </h2>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              Tenant Email *
            </label>
            <input
              name="tenantEmail"
              type="email"
              required
              placeholder="tenant@example.com"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}
            />
            <p style={{ color: "var(--secondary)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              An account will be created if the tenant doesn't exist yet.
            </p>
          </div>
        </div>

        {/* Lease Terms */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Lease Terms
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Start Date *
              </label>
              <input
                name="startDate"
                type="date"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                End Date *
              </label>
              <input
                name="endDate"
                type="date"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Monthly Rent ($) *
              </label>
              <input
                name="monthlyRent"
                type="number"
                step="0.01"
                required
                placeholder="2000"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Security Deposit ($)
              </label>
              <input
                name="securityDeposit"
                type="number"
                step="0.01"
                placeholder="2000"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Late Fee Policy */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Late Fee Policy
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Late Fee Amount ($)
              </label>
              <input
                name="lateFeeAmount"
                type="number"
                step="0.01"
                placeholder="50"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Grace Period (days)
              </label>
              <input
                name="lateFeeGraceDays"
                type="number"
                defaultValue={5}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Additional Terms */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Additional Terms
          </h2>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              Pet Policy
            </label>
            <select
              name="petPolicy"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                backgroundColor: "white",
              }}
            >
              <option value="no_pets">No Pets Allowed</option>
              <option value="cats_only">Cats Only</option>
              <option value="dogs_only">Dogs Only</option>
              <option value="cats_and_dogs">Cats and Dogs</option>
              <option value="all_pets">All Pets Allowed</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              Additional Terms & Notes
            </label>
            <textarea
              name="terms"
              rows={4}
              placeholder="Any additional lease terms or notes..."
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "0.75rem 2rem" }}
            disabled={availableUnits.length === 0}
          >
            Create Lease
          </button>
          <Link
            href="/landlord/leases"
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
    </main>
  );
}
