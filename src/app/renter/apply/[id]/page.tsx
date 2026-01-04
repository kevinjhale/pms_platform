import { getPublicListingById } from "@/services/listings";
import {
  createApplication,
  getExistingApplication,
  updateApplication,
  submitApplication,
  getApplicationById,
} from "@/services/applications";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: unitId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/renter/apply/${unitId}`);
  }

  const listing = await getPublicListingById(unitId);
  if (!listing) {
    notFound();
  }

  // Check for existing application
  let application = await getExistingApplication(unitId, session.user.id);

  // Create new application if none exists
  if (!application) {
    application = await createApplication(unitId, session.user.id);
  }

  // If already submitted, show status
  if (application.status !== "draft") {
    return (
      <main
        className="container"
        style={{ paddingTop: "4rem", paddingBottom: "4rem", maxWidth: "600px" }}
      >
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            {application.status === "submitted" && "📋"}
            {application.status === "under_review" && "🔍"}
            {application.status === "approved" && "🎉"}
            {application.status === "rejected" && "❌"}
          </div>
          <h1 style={{ marginBottom: "0.5rem" }}>
            Application{" "}
            {application.status === "submitted"
              ? "Submitted"
              : application.status === "under_review"
              ? "Under Review"
              : application.status === "approved"
              ? "Approved!"
              : "Declined"}
          </h1>
          <p style={{ color: "var(--secondary)", marginBottom: "1.5rem" }}>
            {listing.title}
          </p>
          {application.status === "approved" && (
            <p style={{ marginBottom: "1.5rem" }}>
              Congratulations! The landlord will contact you with next steps.
            </p>
          )}
          <Link
            href="/renter/browse"
            className="btn"
            style={{ textDecoration: "none", border: "1px solid var(--border)" }}
          >
            Browse More Listings
          </Link>
        </div>
      </main>
    );
  }

  async function saveAndSubmit(formData: FormData) {
    "use server";

    const appSession = await auth();
    if (!appSession?.user?.id) return;

    const existingApp = await getExistingApplication(unitId, appSession.user.id);
    if (!existingApp) return;

    await updateApplication(existingApp.id, {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      currentAddress: formData.get("currentAddress") as string,
      currentCity: formData.get("currentCity") as string,
      currentState: formData.get("currentState") as string,
      currentZip: formData.get("currentZip") as string,
      currentRent: parseInt(formData.get("currentRent") as string) || null,
      currentLandlord: formData.get("currentLandlord") as string,
      currentLandlordPhone: formData.get("currentLandlordPhone") as string,
      employer: formData.get("employer") as string,
      employerPhone: formData.get("employerPhone") as string,
      jobTitle: formData.get("jobTitle") as string,
      monthlyIncome: parseInt(formData.get("monthlyIncome") as string) || null,
      hasPets: formData.get("hasPets") === "yes",
      backgroundCheckConsent: formData.get("consent") === "on",
    });

    await submitApplication(existingApp.id);

    revalidatePath(`/renter/apply/${unitId}`);
    redirect(`/renter/apply/${unitId}`);
  }

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem", maxWidth: "800px" }}
    >
      <Link
        href={`/renter/listing/${unitId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "var(--secondary)",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        &larr; Back to listing
      </Link>

      <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Rental Application
        </h1>
        <p style={{ color: "var(--secondary)" }}>
          {listing.title} - ${listing.price.toLocaleString()}/mo
        </p>
      </div>

      <form action={saveAndSubmit}>
        {/* Personal Information */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Personal Information
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                First Name *
              </label>
              <input
                name="firstName"
                required
                defaultValue={application.firstName || ""}
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
                Last Name *
              </label>
              <input
                name="lastName"
                required
                defaultValue={application.lastName || ""}
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
                Phone *
              </label>
              <input
                name="phone"
                type="tel"
                required
                defaultValue={application.phone || ""}
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
                Date of Birth *
              </label>
              <input
                name="dateOfBirth"
                type="date"
                required
                defaultValue={application.dateOfBirth || ""}
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

        {/* Current Address */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Current Residence
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Current Address *
              </label>
              <input
                name="currentAddress"
                required
                defaultValue={application.currentAddress || ""}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  City *
                </label>
                <input
                  name="currentCity"
                  required
                  defaultValue={application.currentCity || ""}
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
                  State *
                </label>
                <input
                  name="currentState"
                  required
                  defaultValue={application.currentState || ""}
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
                  ZIP *
                </label>
                <input
                  name="currentZip"
                  required
                  defaultValue={application.currentZip || ""}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  Current Rent ($/mo)
                </label>
                <input
                  name="currentRent"
                  type="number"
                  defaultValue={application.currentRent || ""}
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
                  Landlord Name
                </label>
                <input
                  name="currentLandlord"
                  defaultValue={application.currentLandlord || ""}
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
                  Landlord Phone
                </label>
                <input
                  name="currentLandlordPhone"
                  type="tel"
                  defaultValue={application.currentLandlordPhone || ""}
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
        </div>

        {/* Employment */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Employment Information
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Employer *
              </label>
              <input
                name="employer"
                required
                defaultValue={application.employer || ""}
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
                Job Title *
              </label>
              <input
                name="jobTitle"
                required
                defaultValue={application.jobTitle || ""}
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
                Employer Phone
              </label>
              <input
                name="employerPhone"
                type="tel"
                defaultValue={application.employerPhone || ""}
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
                Monthly Income *
              </label>
              <input
                name="monthlyIncome"
                type="number"
                required
                defaultValue={application.monthlyIncome || ""}
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

        {/* Additional Info */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Additional Information
          </h2>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              Do you have pets?
            </label>
            <select
              name="hasPets"
              defaultValue={application.hasPets ? "yes" : "no"}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                backgroundColor: "white",
              }}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        {/* Consent */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <label style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <input
              type="checkbox"
              name="consent"
              required
              style={{ marginTop: "0.25rem" }}
            />
            <span style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
              I authorize the landlord to obtain consumer reports, including credit and
              background checks, in connection with this rental application. I certify
              that all information provided is accurate and complete.
            </span>
          </label>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
            Submit Application
          </button>
        </div>
      </form>
    </main>
  );
}
