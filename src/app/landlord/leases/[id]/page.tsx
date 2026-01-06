import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getLeaseById,
  getPaymentsByLease,
  activateLease,
  terminateLease,
  recordPayment,
} from "@/services/leases";
import { auth } from "@/lib/auth";
import { centsToDollars } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "#f1f5f9", color: "#64748b", label: "Draft" },
  pending: { bg: "#fff7ed", color: "#9a3412", label: "Pending Activation" },
  active: { bg: "#f0fdf4", color: "#15803d", label: "Active" },
  expired: { bg: "#fef3c7", color: "#92400e", label: "Expired" },
  terminated: { bg: "#fee2e2", color: "#991b1b", label: "Terminated" },
  renewed: { bg: "#eff6ff", color: "#1d4ed8", label: "Renewed" },
};

const PAYMENT_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  upcoming: { bg: "#f1f5f9", color: "#64748b" },
  due: { bg: "#fff7ed", color: "#9a3412" },
  partial: { bg: "#fef3c7", color: "#92400e" },
  paid: { bg: "#f0fdf4", color: "#15803d" },
  late: { bg: "#fee2e2", color: "#991b1b" },
  waived: { bg: "#f1f5f9", color: "#64748b" },
};

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const lease = await getLeaseById(id);
  if (!lease) {
    notFound();
  }

  const payments = await getPaymentsByLease(id);
  const statusStyle = STATUS_STYLES[lease.status] || STATUS_STYLES.draft;

  const totalDue = payments.reduce((sum, p) => sum + p.amountDue + (p.lateFee || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const balance = totalDue - totalPaid;

  async function activate() {
    "use server";
    await activateLease(id);
    revalidatePath(`/landlord/leases/${id}`);
  }

  async function terminate(formData: FormData) {
    "use server";
    const appSession = await auth();
    if (!appSession?.user?.id) return;

    const reason = formData.get("reason") as string;
    await terminateLease(id, appSession.user.id, reason);
    revalidatePath(`/landlord/leases/${id}`);
  }

  return (
    <main
      className="container"
      style={{ paddingTop: "4rem", paddingBottom: "4rem", maxWidth: "1000px" }}
    >
      {/* Header */}
      <div
        className="card"
        style={{
          padding: "1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
            {lease.propertyName}
            {lease.unitNumber && ` - Unit ${lease.unitNumber}`}
          </h1>
          <p style={{ color: "var(--secondary)", marginBottom: "0.5rem" }}>
            {lease.propertyAddress}
          </p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "600",
                backgroundColor: statusStyle.bg,
                color: statusStyle.color,
              }}
            >
              {statusStyle.label}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--secondary)" }}>
              {new Date(lease.startDate).toLocaleDateString()} -{" "}
              {new Date(lease.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
            ${centsToDollars(lease.monthlyRent).toLocaleString()}
          </div>
          <div style={{ color: "var(--secondary)" }}>per month</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Tenant Info */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Tenant
          </h2>
          <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>{lease.tenantName}</div>
          <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>
            {lease.tenantEmail}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Financial Summary
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Total Due:</div>
            <div style={{ fontWeight: "500", textAlign: "right" }}>
              ${centsToDollars(totalDue).toLocaleString()}
            </div>
            <div style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Total Paid:</div>
            <div style={{ fontWeight: "500", textAlign: "right", color: "var(--success)" }}>
              ${centsToDollars(totalPaid).toLocaleString()}
            </div>
            <div
              style={{
                color: "var(--secondary)",
                fontSize: "0.875rem",
                borderTop: "1px solid var(--border)",
                paddingTop: "0.5rem",
              }}
            >
              Balance:
            </div>
            <div
              style={{
                fontWeight: "600",
                textAlign: "right",
                borderTop: "1px solid var(--border)",
                paddingTop: "0.5rem",
                color: balance > 0 ? "var(--error)" : "var(--success)",
              }}
            >
              ${centsToDollars(balance).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Lease Details */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Lease Details
          </h2>
          <dl style={{ display: "grid", gap: "0.5rem" }}>
            {lease.securityDeposit && (
              <>
                <dt style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>
                  Security Deposit
                </dt>
                <dd style={{ fontWeight: "500" }}>
                  ${centsToDollars(lease.securityDeposit).toLocaleString()}
                </dd>
              </>
            )}
            {lease.lateFeeAmount && (
              <>
                <dt style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Late Fee</dt>
                <dd style={{ fontWeight: "500" }}>
                  ${centsToDollars(lease.lateFeeAmount).toLocaleString()} after{" "}
                  {lease.lateFeeGraceDays} days
                </dd>
              </>
            )}
            <dt style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Pet Policy</dt>
            <dd style={{ fontWeight: "500" }}>
              {lease.petPolicy?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
                "No Pets"}
            </dd>
          </dl>
        </div>

        {/* Actions */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {lease.status === "pending" && (
              <form action={activate}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  Activate Lease
                </button>
              </form>
            )}
            {(lease.status === "active" || lease.status === "pending") && (
              <form action={terminate}>
                <input type="hidden" name="reason" value="Early termination" />
                <button
                  type="submit"
                  className="btn"
                  style={{
                    width: "100%",
                    border: "1px solid var(--error)",
                    color: "var(--error)",
                  }}
                >
                  Terminate Lease
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="card" style={{ padding: "1.5rem", marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
          Payment Schedule
        </h2>
        {payments.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "0.75rem 0" }}>Period</th>
                <th style={{ padding: "0.75rem 0" }}>Due Date</th>
                <th style={{ padding: "0.75rem 0" }}>Amount</th>
                <th style={{ padding: "0.75rem 0" }}>Paid</th>
                <th style={{ padding: "0.75rem 0" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 12).map((payment) => {
                const paymentStyle =
                  PAYMENT_STATUS_STYLES[payment.status] || PAYMENT_STATUS_STYLES.upcoming;
                return (
                  <tr key={payment.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 0", fontSize: "0.875rem" }}>
                      {new Date(payment.periodStart).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "0.75rem 0", fontSize: "0.875rem" }}>
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem 0", fontWeight: "500" }}>
                      ${centsToDollars(payment.amountDue).toLocaleString()}
                      {payment.lateFee ? (
                        <span style={{ color: "var(--error)", fontSize: "0.75rem" }}>
                          {" "}
                          +${centsToDollars(payment.lateFee)}
                        </span>
                      ) : null}
                    </td>
                    <td style={{ padding: "0.75rem 0", color: "var(--success)" }}>
                      {payment.amountPaid
                        ? `$${centsToDollars(payment.amountPaid).toLocaleString()}`
                        : "-"}
                    </td>
                    <td style={{ padding: "0.75rem 0" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "12px",
                          fontSize: "0.7rem",
                          fontWeight: "600",
                          backgroundColor: paymentStyle.bg,
                          color: paymentStyle.color,
                          textTransform: "capitalize",
                        }}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "var(--secondary)" }}>No payments scheduled yet.</p>
        )}
      </div>

      {/* Terms */}
      {lease.terms && (
        <div className="card" style={{ padding: "1.5rem", marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Additional Terms
          </h2>
          <p style={{ color: "var(--secondary)", whiteSpace: "pre-wrap" }}>{lease.terms}</p>
        </div>
      )}
    </main>
  );
}
