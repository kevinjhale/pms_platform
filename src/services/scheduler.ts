import cron, { ScheduledTask } from 'node-cron';
import {
  getDb,
  rentPayments,
  leases,
  units,
  properties,
  users,
} from '@/db';
import { eq, and, gte, lte, or, lt } from 'drizzle-orm';
import { sendRentReminderEmail, sendLeaseExpiringEmail } from './email';
import { centsToDollars } from '@/lib/utils';

// ============ PAYMENT REMINDER JOBS ============

type PaymentWithTenant = {
  id: string;
  dueDate: Date;
  amountDue: number;
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
};

async function getPaymentsDueInDays(days: number): Promise<PaymentWithTenant[]> {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + days);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const results = await db
    .select({
      id: rentPayments.id,
      dueDate: rentPayments.dueDate,
      amountDue: rentPayments.amountDue,
      tenantEmail: users.email,
      tenantName: users.name,
      propertyName: properties.name,
    })
    .from(rentPayments)
    .innerJoin(leases, eq(rentPayments.leaseId, leases.id))
    .innerJoin(users, eq(leases.tenantId, users.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(leases.status, 'active'),
        or(
          eq(rentPayments.status, 'upcoming'),
          eq(rentPayments.status, 'due')
        ),
        gte(rentPayments.dueDate, targetDate),
        lt(rentPayments.dueDate, nextDay)
      )
    );

  return results.map((r) => ({
    id: r.id,
    dueDate: new Date(r.dueDate),
    amountDue: r.amountDue,
    tenantEmail: r.tenantEmail,
    tenantName: r.tenantName || 'Tenant',
    propertyName: r.propertyName,
  }));
}

async function getLatePayments(): Promise<PaymentWithTenant[]> {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results = await db
    .select({
      id: rentPayments.id,
      dueDate: rentPayments.dueDate,
      amountDue: rentPayments.amountDue,
      tenantEmail: users.email,
      tenantName: users.name,
      propertyName: properties.name,
    })
    .from(rentPayments)
    .innerJoin(leases, eq(rentPayments.leaseId, leases.id))
    .innerJoin(users, eq(leases.tenantId, users.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(leases.status, 'active'),
        or(
          eq(rentPayments.status, 'due'),
          eq(rentPayments.status, 'late')
        ),
        lt(rentPayments.dueDate, today)
      )
    );

  return results.map((r) => ({
    id: r.id,
    dueDate: new Date(r.dueDate),
    amountDue: r.amountDue,
    tenantEmail: r.tenantEmail,
    tenantName: r.tenantName || 'Tenant',
    propertyName: r.propertyName,
  }));
}

async function sendRentReminders(daysBeforeDue: number): Promise<number> {
  const payments = await getPaymentsDueInDays(daysBeforeDue);
  let sent = 0;

  for (const payment of payments) {
    try {
      const success = await sendRentReminderEmail({
        to: payment.tenantEmail,
        tenantName: payment.tenantName,
        propertyName: payment.propertyName,
        amountDue: centsToDollars(payment.amountDue),
        dueDate: payment.dueDate.toLocaleDateString(),
      });
      if (success) sent++;
    } catch (error) {
      console.error(`[Scheduler] Failed to send rent reminder to ${payment.tenantEmail}:`, error);
    }
  }

  return sent;
}

async function sendLatePaymentReminders(): Promise<number> {
  const payments = await getLatePayments();
  let sent = 0;

  // Update status to 'late' and send reminder
  const db = getDb();
  for (const payment of payments) {
    try {
      // Update payment status to late
      await db
        .update(rentPayments)
        .set({ status: 'late', updatedAt: new Date() })
        .where(eq(rentPayments.id, payment.id));

      const success = await sendRentReminderEmail({
        to: payment.tenantEmail,
        tenantName: payment.tenantName,
        propertyName: payment.propertyName,
        amountDue: centsToDollars(payment.amountDue),
        dueDate: `${payment.dueDate.toLocaleDateString()} (OVERDUE)`,
      });
      if (success) sent++;
    } catch (error) {
      console.error(`[Scheduler] Failed to send late payment reminder to ${payment.tenantEmail}:`, error);
    }
  }

  return sent;
}

// ============ LEASE EXPIRY JOBS ============

type LeaseWithTenant = {
  id: string;
  endDate: Date;
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
};

async function getLeasesExpiringInDays(days: number): Promise<LeaseWithTenant[]> {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + days);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const results = await db
    .select({
      id: leases.id,
      endDate: leases.endDate,
      tenantEmail: users.email,
      tenantName: users.name,
      propertyName: properties.name,
    })
    .from(leases)
    .innerJoin(users, eq(leases.tenantId, users.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(leases.status, 'active'),
        gte(leases.endDate, targetDate),
        lt(leases.endDate, nextDay)
      )
    );

  return results.map((r) => ({
    id: r.id,
    endDate: new Date(r.endDate),
    tenantEmail: r.tenantEmail,
    tenantName: r.tenantName || 'Tenant',
    propertyName: r.propertyName,
  }));
}

async function sendLeaseExpiryReminders(daysUntilExpiry: number): Promise<number> {
  const expiringLeases = await getLeasesExpiringInDays(daysUntilExpiry);
  let sent = 0;

  for (const lease of expiringLeases) {
    try {
      const success = await sendLeaseExpiringEmail({
        to: lease.tenantEmail,
        tenantName: lease.tenantName,
        propertyName: lease.propertyName,
        expiryDate: lease.endDate.toLocaleDateString(),
        daysUntilExpiry,
      });
      if (success) sent++;
    } catch (error) {
      console.error(`[Scheduler] Failed to send lease expiry reminder to ${lease.tenantEmail}:`, error);
    }
  }

  return sent;
}

// ============ UPDATE PAYMENT STATUSES ============

async function updatePaymentStatuses(): Promise<number> {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the date 3 days from now for "due soon" status
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  let updated = 0;

  // Update 'upcoming' to 'due' for payments due within 3 days
  const dueResult = await db
    .update(rentPayments)
    .set({ status: 'due', updatedAt: new Date() })
    .where(
      and(
        eq(rentPayments.status, 'upcoming'),
        lte(rentPayments.dueDate, threeDaysFromNow)
      )
    );

  // Update 'due' to 'late' for overdue payments
  const lateResult = await db
    .update(rentPayments)
    .set({ status: 'late', updatedAt: new Date() })
    .where(
      and(
        eq(rentPayments.status, 'due'),
        lt(rentPayments.dueDate, today)
      )
    );

  return updated;
}

// ============ JOB DEFINITIONS ============

export function runAllJobs(): void {
  console.log('[Scheduler] Running all scheduled jobs...');

  // Run immediately
  runDailyJobs();
}

async function runDailyJobs(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[Scheduler] Starting daily jobs at ${timestamp}`);

  try {
    // Update payment statuses first
    await updatePaymentStatuses();
    console.log('[Scheduler] Payment statuses updated');

    // Send rent reminders - 3 days before due
    const reminders3Days = await sendRentReminders(3);
    console.log(`[Scheduler] Sent ${reminders3Days} rent reminders (3 days before due)`);

    // Send rent reminders - on due date
    const remindersDueDate = await sendRentReminders(0);
    console.log(`[Scheduler] Sent ${remindersDueDate} rent reminders (due today)`);

    // Send late payment reminders
    const lateReminders = await sendLatePaymentReminders();
    console.log(`[Scheduler] Sent ${lateReminders} late payment reminders`);

    // Send lease expiry reminders - 30 days
    const expiry30 = await sendLeaseExpiryReminders(30);
    console.log(`[Scheduler] Sent ${expiry30} lease expiry reminders (30 days)`);

    // Send lease expiry reminders - 14 days
    const expiry14 = await sendLeaseExpiryReminders(14);
    console.log(`[Scheduler] Sent ${expiry14} lease expiry reminders (14 days)`);

    // Send lease expiry reminders - 7 days
    const expiry7 = await sendLeaseExpiryReminders(7);
    console.log(`[Scheduler] Sent ${expiry7} lease expiry reminders (7 days)`);

    console.log(`[Scheduler] Daily jobs completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('[Scheduler] Error running daily jobs:', error);
  }
}

// ============ SCHEDULER START ============

let scheduledTasks: ScheduledTask[] = [];

export function startScheduler(): void {
  console.log('[Scheduler] Starting background job scheduler...');

  // Run daily at 8:00 AM
  const dailyJob = cron.schedule('0 8 * * *', () => {
    runDailyJobs();
  }, {
    timezone: 'America/Denver', // Adjust to your timezone
  });

  scheduledTasks.push(dailyJob);

  console.log('[Scheduler] Scheduled jobs:');
  console.log('  - Daily rent & lease reminders at 8:00 AM');
  console.log('[Scheduler] Scheduler started successfully');
}

export function stopScheduler(): void {
  console.log('[Scheduler] Stopping scheduler...');
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks = [];
  console.log('[Scheduler] Scheduler stopped');
}

// Export individual job functions for testing/manual runs
export {
  sendRentReminders,
  sendLatePaymentReminders,
  sendLeaseExpiryReminders,
  updatePaymentStatuses,
  runDailyJobs,
};
