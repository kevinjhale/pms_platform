# SMTP Email Configuration

This guide explains how to configure email notifications for PMS Platform.

## Overview

PMS Platform uses Nodemailer to send email notifications for:
- Organization invites
- Application submissions and status updates
- Maintenance request notifications
- Rent payment reminders
- Lease expiry alerts

## Environment Variables

Add these to your `.env` file:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@your-domain.com"
APP_NAME="Your Company Name"
```

## Provider Setup Guides

### Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google account

2. **Generate an App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Under "Signing in to Google", click "App passwords"
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password

3. **Configure environment**:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="xxxx xxxx xxxx xxxx"  # App password (no spaces)
   EMAIL_FROM="your-email@gmail.com"
   ```

**Note**: Gmail has a daily sending limit of 500 emails for personal accounts.

### SendGrid (Recommended for Production)

1. **Create a SendGrid account** at [sendgrid.com](https://sendgrid.com)

2. **Create an API Key**:
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Choose "Restricted Access" and enable "Mail Send"
   - Copy the API key

3. **Verify a Sender**:
   - Go to Settings > Sender Authentication
   - Either verify a single sender or authenticate your domain

4. **Configure environment**:
   ```env
   SMTP_HOST="smtp.sendgrid.net"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="apikey"
   SMTP_PASS="SG.xxxxxxxxxxxxxxxxxxxx"  # Your API key
   EMAIL_FROM="noreply@your-verified-domain.com"
   ```

### Amazon SES

1. **Set up Amazon SES** in your AWS Console

2. **Verify your domain or email addresses**

3. **Create SMTP credentials**:
   - Go to SES > SMTP Settings
   - Click "Create SMTP Credentials"
   - Save the username and password

4. **Configure environment**:
   ```env
   SMTP_HOST="email-smtp.us-east-1.amazonaws.com"  # Use your region
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-smtp-username"
   SMTP_PASS="your-smtp-password"
   EMAIL_FROM="noreply@your-verified-domain.com"
   ```

**Note**: New SES accounts are in sandbox mode. You'll need to request production access to send to unverified addresses.

### Mailgun

1. **Create a Mailgun account** at [mailgun.com](https://www.mailgun.com)

2. **Add and verify your domain**

3. **Get SMTP credentials** from Domain Settings

4. **Configure environment**:
   ```env
   SMTP_HOST="smtp.mailgun.org"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="postmaster@your-domain.mailgun.org"
   SMTP_PASS="your-smtp-password"
   EMAIL_FROM="noreply@your-domain.com"
   ```

### Postmark

1. **Create a Postmark account** at [postmarkapp.com](https://postmarkapp.com)

2. **Create a Server** and get credentials

3. **Configure environment**:
   ```env
   SMTP_HOST="smtp.postmarkapp.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-server-api-token"
   SMTP_PASS="your-server-api-token"
   EMAIL_FROM="noreply@your-verified-domain.com"
   ```

## Testing Your Configuration

1. **Start the development server**:
   ```bash
   bun run dev
   ```

2. **Run the scheduler once** to trigger test emails:
   ```bash
   npm run scheduler:once
   ```

3. **Check the console** for email sending logs:
   ```
   [Email] Sent: Rent Reminder to alice.johnson@demo.com
   ```

4. **Check your inbox** (or spam folder) for test emails

## Troubleshooting

### "SMTP not configured, skipping email"

This means `SMTP_USER` or `SMTP_PASS` is not set. Check your `.env` file.

### "Invalid login" or "Authentication failed"

- For Gmail: Make sure you're using an App Password, not your regular password
- For other providers: Verify your credentials are correct
- Check that your account is not locked or requiring verification

### "Connection refused" or "Connection timed out"

- Verify `SMTP_HOST` and `SMTP_PORT` are correct
- Check if your firewall allows outbound connections on port 587
- Try port 465 with `SMTP_SECURE="true"` if 587 doesn't work

### Emails going to spam

- Verify your sending domain has proper SPF, DKIM, and DMARC records
- Use a professional email provider (SendGrid, SES, Mailgun)
- Avoid spam trigger words in email content
- Make sure `EMAIL_FROM` uses a domain you own/control

## Email Templates

All email templates are defined in `src/services/email.ts`. Templates include:

| Function | Trigger | Description |
|----------|---------|-------------|
| `sendInviteEmail` | Organization invite created | Invitation to join organization |
| `sendApplicationSubmittedEmail` | Application submitted | Notify landlord of new application |
| `sendApplicationStatusEmail` | Application approved/rejected | Notify applicant of decision |
| `sendMaintenanceCreatedEmail` | Maintenance request created | Notify property managers |
| `sendMaintenanceStatusEmail` | Maintenance status updated | Notify tenant of progress |
| `sendRentReminderEmail` | Scheduled job | Payment reminder to tenant |
| `sendLeaseExpiringEmail` | Scheduled job | Lease expiry notification |

## Background Job Scheduler

The scheduler sends automated emails for rent reminders and lease expiry alerts:

```bash
# Start the scheduler daemon (runs daily at 8am)
npm run scheduler

# Or run once for testing
npm run scheduler:once
```

The scheduler handles:
- Rent reminders 3 days before due date
- Rent reminders on due date
- Late payment notifications
- Lease expiry reminders (30, 14, 7 days before)

Configure the timezone in `src/services/scheduler.ts`:
```typescript
const dailyJob = cron.schedule('0 8 * * *', () => {
  runDailyJobs();
}, {
  timezone: 'America/Denver', // Change to your timezone
});
```
