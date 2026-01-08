import nodemailer, { Transporter } from 'nodemailer';
import { getSmtpSettingsWithFallback, hasIntegrationSettings } from './integrationSettings';
import type { SmtpSettings } from '@/lib/integrations/types';

// Cache for transporters per organization
const transporterCache = new Map<string, Transporter>();

// Global transporter for backward compatibility (uses env vars)
const globalTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@pms-platform.local';
const APP_NAME = process.env.APP_NAME || 'PMS Platform';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Get transporter for a specific organization
 * Falls back to global transporter if org has no custom settings
 */
async function getTransporterForOrg(orgId: string): Promise<Transporter | null> {
  if (transporterCache.has(orgId)) {
    return transporterCache.get(orgId)!;
  }

  const settings = await getSmtpSettingsWithFallback(orgId);

  if (!settings.user || !settings.pass) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: settings.host || 'smtp.gmail.com',
    port: settings.port || 587,
    secure: settings.secure || false,
    auth: {
      user: settings.user,
      pass: settings.pass,
    },
  });

  transporterCache.set(orgId, transporter);
  return transporter;
}

/**
 * Get email settings (from address, app name) for an organization
 */
async function getEmailSettings(orgId?: string): Promise<{ fromEmail: string; appName: string }> {
  if (!orgId) {
    return { fromEmail: FROM_EMAIL, appName: APP_NAME };
  }

  const settings = await getSmtpSettingsWithFallback(orgId);
  return {
    fromEmail: settings.fromAddress || FROM_EMAIL,
    appName: settings.appName || APP_NAME,
  };
}

/**
 * Check if SMTP is configured for an organization
 */
export async function isSmtpConfiguredForOrg(orgId: string): Promise<boolean> {
  const transporter = await getTransporterForOrg(orgId);
  return !!transporter;
}

/**
 * Check if organization has custom SMTP settings
 */
export async function hasCustomSmtpSettings(orgId: string): Promise<boolean> {
  return hasIntegrationSettings(orgId, 'smtp');
}

/**
 * Clear cached transporter for an organization (call when settings change)
 */
export function clearEmailCache(orgId: string): void {
  transporterCache.delete(orgId);
}

/**
 * Clear all cached transporters
 */
export function clearAllEmailCache(): void {
  transporterCache.clear();
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  organizationId?: string; // Optional for backward compatibility
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = options.organizationId
    ? await getTransporterForOrg(options.organizationId)
    : globalTransporter;

  // Skip sending if SMTP is not configured
  if (!transporter) {
    console.log('[Email] SMTP not configured, skipping email:', options.subject);
    return false;
  }

  // Check global config if not using org-specific
  if (!options.organizationId && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    console.log('[Email] SMTP not configured, skipping email:', options.subject);
    return false;
  }

  const { fromEmail, appName } = await getEmailSettings(options.organizationId);

  try {
    await transporter.sendMail({
      from: `"${appName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    });
    console.log('[Email] Sent:', options.subject, 'to', options.to);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Email wrapper for consistent styling
function emailWrapper(content: string, appName: string = APP_NAME): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <!-- Header -->
              <tr>
                <td style="padding: 32px 40px; border-bottom: 1px solid #e2e8f0;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #0f172a;">${appName}</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                    This email was sent by ${appName}. If you didn't expect this email, you can safely ignore it.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Test SMTP connection with provided settings
 */
export async function testSmtpConnection(settings: Partial<SmtpSettings>): Promise<{ valid: boolean; message: string }> {
  if (!settings.host || !settings.user || !settings.pass) {
    return { valid: false, message: 'Missing required SMTP settings' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port || 587,
      secure: settings.secure || false,
      auth: {
        user: settings.user,
        pass: settings.pass,
      },
    });

    await transporter.verify();
    return { valid: true, message: 'Connection successful' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    return { valid: false, message };
  }
}

// ============= Email Templates =============

interface OrgEmailParams {
  organizationId?: string;
}

// Organization Invite
export async function sendInviteEmail(params: {
  to: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteToken: string;
} & OrgEmailParams): Promise<boolean> {
  const acceptUrl = `${APP_URL}/invite/accept?token=${params.inviteToken}`;
  const { appName } = await getEmailSettings(params.organizationId);

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;">You've been invited!</h2>
    <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
      ${params.inviterName} has invited you to join <strong>${params.organizationName}</strong> as a <strong>${params.role}</strong>.
    </p>
    <a href="${acceptUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Accept Invitation
    </a>
    <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">
      Or copy this link: ${acceptUrl}
    </p>
  `;

  return sendEmail({
    to: params.to,
    subject: `You're invited to join ${params.organizationName}`,
    html: emailWrapper(content, appName),
    organizationId: params.organizationId,
  });
}

// Application Submitted (to landlord)
export async function sendApplicationSubmittedEmail(params: {
  to: string;
  applicantName: string;
  propertyName: string;
  unitNumber?: string;
  applicationId: string;
} & OrgEmailParams): Promise<boolean> {
  const reviewUrl = `${APP_URL}/landlord/applications/${params.applicationId}`;
  const unitInfo = params.unitNumber ? ` - Unit ${params.unitNumber}` : '';
  const { appName } = await getEmailSettings(params.organizationId);

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;">New Application Received</h2>
    <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
      <strong>${params.applicantName}</strong> has submitted an application for <strong>${params.propertyName}${unitInfo}</strong>.
    </p>
    <a href="${reviewUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Review Application
    </a>
  `;

  return sendEmail({
    to: params.to,
    subject: `New application for ${params.propertyName}${unitInfo}`,
    html: emailWrapper(content, appName),
    organizationId: params.organizationId,
  });
}

// Application Status Update (to applicant)
export async function sendApplicationStatusEmail(params: {
  to: string;
  applicantName: string;
  propertyName: string;
  unitNumber?: string;
  status: 'approved' | 'rejected' | 'under_review';
} & OrgEmailParams): Promise<boolean> {
  const unitInfo = params.unitNumber ? ` - Unit ${params.unitNumber}` : '';
  const { appName } = await getEmailSettings(params.organizationId);

  const statusMessages = {
    approved: {
      title: 'Application Approved!',
      message: `Congratulations! Your application for <strong>${params.propertyName}${unitInfo}</strong> has been approved. The landlord will contact you with next steps.`,
      color: '#16a34a',
    },
    rejected: {
      title: 'Application Update',
      message: `Unfortunately, your application for <strong>${params.propertyName}${unitInfo}</strong> was not approved at this time. We encourage you to explore other listings.`,
      color: '#dc2626',
    },
    under_review: {
      title: 'Application Under Review',
      message: `Your application for <strong>${params.propertyName}${unitInfo}</strong> is now being reviewed. We'll notify you when there's an update.`,
      color: '#2563eb',
    },
  };

  const status = statusMessages[params.status];

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: ${status.color};">${status.title}</h2>
    <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.6;">
      Hi ${params.applicantName},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
      ${status.message}
    </p>
    <a href="${APP_URL}/renter/applications" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
      View My Applications
    </a>
  `;

  return sendEmail({
    to: params.to,
    subject: `Application Update: ${params.propertyName}${unitInfo}`,
    html: emailWrapper(content, appName),
    organizationId: params.organizationId,
  });
}

// Maintenance Request Created (to landlord/PM)
export async function sendMaintenanceCreatedEmail(params: {
  to: string;
  requesterName: string;
  propertyName: string;
  unitNumber?: string;
  title: string;
  priority: string;
  requestId: string;
} & OrgEmailParams): Promise<boolean> {
  const reviewUrl = `${APP_URL}/landlord/maintenance/${params.requestId}`;
  const unitInfo = params.unitNumber ? ` - Unit ${params.unitNumber}` : '';
  const { appName } = await getEmailSettings(params.organizationId);

  const priorityColors: Record<string, string> = {
    emergency: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#64748b',
  };

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;">New Maintenance Request</h2>
    <p style="margin: 0 0 8px; font-size: 16px; color: #334155;">
      <strong>${params.requesterName}</strong> submitted a new maintenance request:
    </p>
    <div style="margin: 16px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid ${priorityColors[params.priority] || '#64748b'};">
      <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #0f172a;">${params.title}</p>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        ${params.propertyName}${unitInfo} •
        <span style="color: ${priorityColors[params.priority] || '#64748b'}; font-weight: 500; text-transform: capitalize;">${params.priority} Priority</span>
      </p>
    </div>
    <a href="${reviewUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
      View Request
    </a>
  `;

  return sendEmail({
    to: params.to,
    subject: `[${params.priority.toUpperCase()}] Maintenance: ${params.title}`,
    html: emailWrapper(content, appName),
    organizationId: params.organizationId,
  });
}

// Maintenance Status Update (to requester)
export async function sendMaintenanceStatusEmail(params: {
  to: string;
  requesterName: string;
  title: string;
  propertyName: string;
  status: string;
  requestId: string;
} & OrgEmailParams): Promise<boolean> {
  const viewUrl = `${APP_URL}/renter/maintenance`;
  const { appName } = await getEmailSettings(params.organizationId);

  const statusMessages: Record<string, { label: string; color: string }> = {
    acknowledged: { label: 'Acknowledged', color: '#2563eb' },
    in_progress: { label: 'In Progress', color: '#7c3aed' },
    pending_parts: { label: 'Pending Parts', color: '#ca8a04' },
    completed: { label: 'Completed', color: '#16a34a' },
    cancelled: { label: 'Cancelled', color: '#64748b' },
  };

  const statusInfo = statusMessages[params.status] || { label: params.status, color: '#64748b' };

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;">Maintenance Update</h2>
    <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.6;">
      Hi ${params.requesterName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.6;">
      Your maintenance request has been updated:
    </p>
    <div style="margin: 16px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px;">
      <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #0f172a;">${params.title}</p>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        ${params.propertyName} •
        <span style="color: ${statusInfo.color}; font-weight: 600;">${statusInfo.label}</span>
      </p>
    </div>
    <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
      View My Requests
    </a>
  `;

  return sendEmail({
    to: params.to,
    subject: `Maintenance Update: ${params.title} - ${statusInfo.label}`,
    html: emailWrapper(content, appName),
    organizationId: params.organizationId,
  });
}

// Rent Payment Reminder
export async function sendRentReminderEmail(params: {
  to: string;
  tenantName: string;
  propertyName: string;
  amountDue: number;
  dueDate: string;
} & OrgEmailParams): Promise<boolean> {
  const payUrl = `${APP_URL}/renter/payments`;
  const { appName } = await getEmailSettings(params.organizationId);

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;">Rent Payment Reminder</h2>
    <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.6;">
      Hi ${params.tenantName},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
      This is a friendly reminder that your rent payment is coming up.
    </p>
    <div style="margin: 16px 0; padding: 24px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #64748b;">${params.propertyName}</p>
      <p style="margin: 0 0 8px; font-size: 32px; font-weight: 700; color: #0f172a;">$${params.amountDue.toLocaleString()}</p>
      <p style="margin: 0; font-size: 14px; color: #64748b;">Due: ${params.dueDate}</p>
    </div>
    <a href="${payUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
      View Payment Details
    </a>
  `;

  return sendEmail({
    to: params.to,
    subject: `Rent Reminder: $${params.amountDue.toLocaleString()} due ${params.dueDate}`,
    html: emailWrapper(content, appName),
    organizationId: params.organizationId,
  });
}

// Lease Expiring Soon
export async function sendLeaseExpiringEmail(params: {
  to: string;
  tenantName: string;
  propertyName: string;
  expiryDate: string;
  daysUntilExpiry: number;
} & OrgEmailParams): Promise<boolean> {
  const { appName } = await getEmailSettings(params.organizationId);

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #ca8a04;">Lease Expiring Soon</h2>
    <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.6;">
      Hi ${params.tenantName},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
      Your lease at <strong>${params.propertyName}</strong> will expire in <strong>${params.daysUntilExpiry} days</strong> (${params.expiryDate}).
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
      Please contact your landlord to discuss renewal options or move-out procedures.
    </p>
    <a href="${APP_URL}/renter/lease" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
      View Lease Details
    </a>
  `;

  return sendEmail({
    to: params.to,
    subject: `Lease Expiring: ${params.daysUntilExpiry} days remaining`,
    html: emailWrapper(content, appName),
    organizationId: params.organizationId,
  });
}
