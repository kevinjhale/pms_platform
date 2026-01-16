import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { getUserById, getUserRoles } from "@/services/users";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's roles from database
  const [user, userRoles] = await Promise.all([
    getUserById(session.user.id),
    getUserRoles(session.user.id),
  ]);

  // Include legacy single role if no roles in junction table
  const roles = userRoles.length > 0 ? userRoles : (user?.role ? [user.role] : []);

  // If user hasn't selected any roles yet, redirect to role selection
  if (roles.length === 0) {
    redirect("/select-role");
  }

  // Helper to check if user has a role
  const hasRole = (role: string) => roles.includes(role as any);

  // Priority routing based on roles (landlord/manager first, then maintenance, then renter)
  // Users with landlord or manager role go to landlord dashboard
  if (hasRole('landlord') || hasRole('manager')) {
    const { organizations } = await getOrgContext();

    // If no organizations, redirect to onboarding
    if (organizations.length === 0) {
      redirect("/onboarding");
    }

    redirect("/landlord");
  }

  // Maintenance workers go to maintenance dashboard
  if (hasRole('maintenance')) {
    redirect("/maintenance");
  }

  // Renters go to renter dashboard
  if (hasRole('renter')) {
    redirect("/renter");
  }

  // Fallback - should not reach here but show basic info
  return (
    <main className="container" style={{ paddingTop: '4rem' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name || session.user.email}!</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Roles: {roles.join(', ') || 'None'}
      </p>
    </main>
  );
}
