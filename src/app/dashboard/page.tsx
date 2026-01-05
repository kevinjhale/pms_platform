import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { getUserById } from "@/services/users";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's role from database (more reliable than session for new users)
  const user = await getUserById(session.user.id);
  const role = user?.role || session.user.role;

  // If user hasn't selected a role yet, redirect to role selection
  // (Demo users have hardcoded roles in auth config, so they skip this)
  if (!role) {
    redirect("/select-role");
  }

  // Renters don't need organizations - direct them to renter dashboard
  if (role === 'renter') {
    redirect("/renter");
  }

  // Maintenance workers go to maintenance dashboard
  if (role === 'maintenance') {
    redirect("/maintenance");
  }

  // Landlords and managers need organizations
  const { organization, organizations } = await getOrgContext();

  // If no organizations, redirect to onboarding (for landlords/managers only)
  if (organizations.length === 0) {
    redirect("/onboarding");
  }

  if (role === 'landlord' || role === 'manager') {
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
