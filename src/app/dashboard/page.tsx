import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check organization membership
  const { organization, organizations } = await getOrgContext();

  // If no organizations, redirect to onboarding
  if (organizations.length === 0) {
    redirect("/onboarding");
  }

  // Role-based routing
  const role = session.user.role;

  if (role === 'renter') {
    redirect("/renter");
  } else if (role === 'landlord' || role === 'manager') {
    redirect("/landlord");
  } else {
    // Default fallback - show dashboard with org info
    return (
      <main className="container" style={{ paddingTop: '4rem' }}>
        <h1>Dashboard</h1>
        <p>Welcome, {session.user.name || session.user.email}!</p>
        {organization && (
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Organization: {organization.name}
          </p>
        )}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Role: {role || 'Member'}
        </p>
      </main>
    );
  }
}
