import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrgContext } from "@/lib/org-context";
import { getUserById } from "@/services/users";
import { getOrganizationMembersWithUsers, getUserRoleInOrganization } from "@/services/organizations";
import { getPendingInvites } from "@/services/invites";
import InviteForm from "./InviteForm";
import RevokeInviteButton from "./RevokeInviteButton";

const PLATFORM_ROLE_LABELS: Record<string, string> = {
  renter: "Renter",
  landlord: "Landlord",
  manager: "Property Manager",
  maintenance: "Maintenance Worker",
};

const ORG_ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  staff: "Staff",
};

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  owner: { bg: "#fef3c7", color: "#92400e" },
  admin: { bg: "#dbeafe", color: "#1d4ed8" },
  manager: { bg: "#d1fae5", color: "#047857" },
  staff: { bg: "#e5e7eb", color: "#374151" },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { organization, organizations, role } = await getOrgContext();
  if (!organization) {
    redirect("/onboarding");
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    redirect("/login");
  }

  const userRole = await getUserRoleInOrganization(session.user.id, organization.id);
  const canInvite = userRole === "owner" || userRole === "admin";

  const [members, pendingInvites] = await Promise.all([
    getOrganizationMembersWithUsers(organization.id),
    canInvite ? getPendingInvites(organization.id) : [],
  ]);

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link
        href="/landlord"
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "var(--secondary)",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Settings</h1>
        <p style={{ color: "var(--secondary)" }}>
          Account and organization information
        </p>
      </div>

      {/* User Information Section */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
          User Information
        </h2>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                User ID
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "0.875rem", backgroundColor: "var(--surface)", padding: "0.5rem", borderRadius: "4px" }}>
                {user.id}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Name
                </span>
                <span style={{ fontSize: "1rem" }}>
                  {user.name || "Not set"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Email
                </span>
                <span style={{ fontSize: "1rem" }}>
                  {user.email}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Platform Role
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    width: "fit-content",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    backgroundColor: "var(--primary)",
                    color: "white",
                  }}
                >
                  {user.role ? PLATFORM_ROLE_LABELS[user.role] || user.role : "Not set"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Account Created
                </span>
                <span style={{ fontSize: "1rem" }}>
                  {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Management Section */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
          Team Management
        </h2>

        {/* Invite Member - Only for owners/admins */}
        {canInvite && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
              Invite Team Member
            </h3>
            <p style={{ color: "var(--secondary)", marginBottom: "1rem", fontSize: "0.875rem" }}>
              Send an invitation to add a new member to your organization. They will receive access
              when they sign up or log in with the invited email address.
            </p>
            <InviteForm />
          </div>
        )}

        {/* Pending Invites - Only for owners/admins */}
        {canInvite && pendingInvites.length > 0 && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
              Pending Invites ({pendingInvites.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {pendingInvites.map((invite) => {
                const roleStyle = ROLE_STYLES[invite.role] || ROLE_STYLES.staff;
                return (
                  <div
                    key={invite.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      backgroundColor: "var(--surface)",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "0.875rem" }}>{invite.email}</span>
                      <span
                        style={{
                          padding: "0.125rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          backgroundColor: roleStyle.bg,
                          color: roleStyle.color,
                        }}
                      >
                        {invite.role}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                        Expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </span>
                      <RevokeInviteButton inviteId={invite.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Current Members */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
            Team Members ({members.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {members.map(({ member, user: memberUser }) => {
              const roleStyle = ROLE_STYLES[member.role] || ROLE_STYLES.staff;
              const isCurrentUser = memberUser.id === session.user?.id;
              return (
                <div
                  key={member.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    backgroundColor: isCurrentUser ? "var(--surface)" : "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {memberUser.image ? (
                      <img
                        src={memberUser.image}
                        alt=""
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "var(--surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "var(--secondary)",
                        }}
                      >
                        {(memberUser.name || memberUser.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: "500", fontSize: "0.875rem" }}>
                        {memberUser.name || "Unnamed User"}
                        {isCurrentUser && (
                          <span style={{ color: "var(--secondary)", fontWeight: "400" }}>
                            {" "}(you)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                        {memberUser.email}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span
                      style={{
                        padding: "0.125rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        backgroundColor: roleStyle.bg,
                        color: roleStyle.color,
                      }}
                    >
                      {member.role}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                      Joined {formatDate(member.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            {members.length === 0 && (
              <p style={{ color: "var(--secondary)", textAlign: "center", padding: "2rem" }}>
                No team members found.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Organizations Section */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
          Organizations
          {organizations.length > 1 && (
            <span style={{ fontSize: "0.875rem", fontWeight: "normal", color: "var(--secondary)", marginLeft: "0.5rem" }}>
              ({organizations.length} total)
            </span>
          )}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {organizations.map((membership) => {
            const isCurrentOrg = membership.organization.id === organization.id;
            return (
              <div
                key={membership.organization.id}
                className="card"
                style={{
                  padding: "1.5rem",
                  border: isCurrentOrg ? "2px solid var(--primary)" : undefined,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                      {membership.organization.name}
                    </h3>
                    {isCurrentOrg && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "4px",
                          backgroundColor: "#e0f2fe",
                          color: "#0369a1",
                        }}
                      >
                        Current Organization
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      backgroundColor: membership.role === "owner" ? "#f0fdf4" : "var(--surface)",
                      color: membership.role === "owner" ? "#15803d" : "inherit",
                    }}
                  >
                    {ORG_ROLE_LABELS[membership.role] || membership.role}
                  </span>
                </div>

                <div style={{ display: "grid", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Organization ID
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: "0.875rem", backgroundColor: "var(--surface)", padding: "0.5rem", borderRadius: "4px" }}>
                      {membership.organization.id}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Slug
                      </span>
                      <span style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                        {membership.organization.slug}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Created
                      </span>
                      <span style={{ fontSize: "0.875rem" }}>
                        {formatDate(membership.organization.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Note */}
      <div
        style={{
          padding: "1rem",
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius)",
          fontSize: "0.875rem",
          color: "var(--secondary)",
        }}
      >
        <strong>Note:</strong> To update your account information or manage organization settings,
        please contact support.
      </div>
    </main>
  );
}
