# PMS Platform - Session Notes

**Last Updated**: 2026-01-09

## Project Overview

Property Management System (PMS) - a multi-tenant platform for landlords, property managers, renters, and maintenance workers built with Next.js 16, Drizzle ORM, and SQLite.

## Current State

The platform now has:
- Complete sidebar navigation for all user types (landlord, renter, maintenance worker)
- Mobile responsiveness with FAB hamburger menu
- Email notification infrastructure with event triggers
- File upload capability for maintenance tickets
- Stripe payment integration with per-organization settings
- Background job scheduler for automated notifications
- Per-organization integration settings UI
- Encrypted credential storage (AES-256-GCM)
- Photo gallery with lightbox viewer for maintenance tickets
- **NEW: Property cards with visible borders and unit counts**
- Comprehensive testing framework (25 tests)
- Full documentation for setup and configuration

---

## What Was Done This Session (2026-01-09)

### Property Manager (PM) Code Audit

Conducted comprehensive review of PM functionality. Found significant gaps between schema design and implementation.

#### Critical Issues Identified

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| **No PM Dashboard** | Critical | `src/app/manager/page.tsx` | Stub page only - PMs redirect to landlord views |
| **PM Assignment Unused** | High | `src/services/properties.ts:207-250` | Functions exist but never called |
| **No PM Access Filtering** | High | `src/services/properties.ts:52-78` | PMs see all org properties, not just assigned ones |
| **Revenue Tracking Missing** | High | `src/db/schema/properties.ts:47` | `splitPercentage` field exists but no reporting |
| **Role Terminology Confusion** | Medium | Schema files | Platform "manager" vs org "manager" role overlap |

#### What Exists But Isn't Wired Up

**Database Schema** (`src/db/schema/properties.ts:43-52`):
```typescript
propertyManagers table:
- propertyId, userId, splitPercentage
- status: 'proposed' | 'accepted' | 'rejected'
- proposedBy, acceptedAt, createdAt
```

**Service Functions** (`src/services/properties.ts:207-250`):
- `assignPropertyManager()` - Creates proposed assignment
- `acceptPropertyManagerAgreement()` - PM accepts terms
- `rejectPropertyManagerAgreement()` - PM rejects
- `getPropertyManagers()` - Get PMs for property

#### Current PM Flow (Broken)
1. PM logs in → redirected to `/landlord` (same as landlord)
2. PM sees ALL org properties (should only see assigned)
3. PM has full landlord access (should be restricted)
4. No way to accept/reject property assignments
5. No revenue tracking or split calculations

### Quick Wins Implemented

**1. Sidebar Role Filtering** (Issue #54)
- Modified `LandlordSidebar.tsx` to accept `userRole` prop
- Added `requiredRoles` field to nav items
- Settings and Screening hidden for non-admin users
- Assignments link visible only for manager/staff roles

**2. PM Property Filtering** (Issue #52)
- Added `getPropertiesForManager()` function in `src/services/properties.ts`
- Properties page now shows only assigned properties for PMs
- Different empty state message for managers

**3. PM Agreement Acceptance UI** (Issue #55)
- Created `/landlord/assignments` page
- `AssignmentCard` component with accept/decline buttons
- Server action `respondToAssignment()` wires to existing backend

### Larger PM Features - Implementation Plans

#### 1. Landlord UI to Propose PM Assignments (Issue #56)
**Files to modify:**
- `src/app/landlord/properties/[id]/page.tsx` - Add "Assign Manager" section
- Create `src/app/landlord/properties/[id]/AssignManagerModal.tsx`
- Create `src/app/actions/pmAssignments.ts` - Server action for assignment

**Steps:**
1. Add "Property Managers" section to property detail page
2. Create modal with user selector (org members) and split % input
3. Wire to existing `assignPropertyManager()` service function
4. Show current managers with status badges

#### 2. PM Revenue Dashboard (Issues #53, #58)
**New files:**
- `src/services/pmRevenue.ts` - Revenue calculation service
- `src/app/landlord/revenue/page.tsx` - Revenue dashboard page
- `src/components/RevenueChart.tsx` - Chart component

**Steps:**
1. Create revenue calculation queries joining payments + propertyManagers
2. Build dashboard with summary cards (monthly, YTD, by property)
3. Add charts using existing chart library or add recharts
4. Export to CSV functionality

#### 3. PM-Specific Notifications (Issue #57)
**Files to modify:**
- `src/services/email.ts` - Add PM notification functions
- `src/app/actions/pmAssignments.ts` - Trigger notifications

**Events to notify:**
- New assignment proposed
- Assignment accepted/rejected (to landlord)
- Maintenance ticket on assigned property
- Rent payment received (when revenue tracking is done)

---

## Previous Session (2026-01-08)

### Photo Gallery for Maintenance Tickets

Added photo gallery display with lightbox viewer for maintenance ticket detail pages:

**New File:**
| File | Purpose |
|------|---------|
| `src/components/PhotoGallery.tsx` | Thumbnail grid with full-screen lightbox viewer |

**Features:**
- Thumbnail grid layout (responsive, auto-fill)
- Full-screen lightbox modal with dark overlay
- Keyboard navigation (arrow keys, Escape to close)
- Previous/Next buttons with image counter
- Hover effects on thumbnails
- Click outside or Escape to close

**Modified Files:**
| File | Changes |
|------|---------|
| `src/app/landlord/maintenance/[id]/page.tsx` | Added PhotoGallery after description |
| `src/app/maintenance/[id]/page.tsx` | Added PhotoGallery after description |

The gallery appears on both landlord/manager and maintenance worker ticket detail views.

### Property Cards Improvements

Enhanced the landlord properties page with better visibility and information:

**Changes:**
- Fixed property card borders (was using undefined `--border-color`, now uses `--border`)
- Fixed other undefined CSS variables (`--text-secondary` → `--secondary`, `--bg-secondary` → `--surface`)
- Added unit count to each property card with blue badge (e.g., "3 units")
- Used consistent `btn btn-primary` class for Add Property button

**Modified Files:**
| File | Changes |
|------|---------|
| `src/app/landlord/properties/page.tsx` | Fixed CSS variables, added unit count display |
| `src/services/properties.ts` | Added `PropertyWithUnitCount` type, modified query to include unit count via subquery |

---

## Previous Session Work (2026-01-07)

### 1. Per-Organization Integration Settings System

Built a comprehensive UI for organization owners/admins to manage third-party service credentials:

**New Files Created:**
| File | Purpose |
|------|---------|
| `src/lib/crypto.ts` | AES-256-GCM encryption using AUTH_SECRET |
| `src/lib/integrations/types.ts` | TypeScript interfaces for all integrations |
| `src/db/schema/integrationSettings.ts` | Database schema for encrypted settings |
| `src/services/integrationSettings.ts` | CRUD operations with encryption/decryption |
| `src/app/actions/integrations.ts` | Server actions for saving/testing settings |
| `src/app/landlord/settings/integrations/page.tsx` | Main integrations page |
| `src/app/landlord/settings/integrations/StripeSettingsForm.tsx` | Stripe config form |
| `src/app/landlord/settings/integrations/SmtpSettingsForm.tsx` | SMTP config form |
| `src/app/landlord/settings/integrations/OAuthSettingsForm.tsx` | OAuth config form |

**Features:**
- Per-organization configuration for Stripe, SMTP, OAuth (Google/GitHub)
- Encrypted storage for API keys and secrets (AES-256-GCM)
- Fallback to environment variables if org has no custom settings
- Test connection buttons to verify credentials before saving
- Import from system defaults (copy .env values to org settings)
- Status badges showing "Custom", "System Default", or "Not Configured"
- Access control: only owners/admins can view/manage settings

**Modified Services:**
- `src/services/stripe.ts` - Added `getStripeForOrg()` with caching and fallback
- `src/services/email.ts` - Added org-aware transporter with caching and fallback
- `src/app/api/payments/checkout/route.ts` - Uses org-specific Stripe settings
- `src/app/api/payments/webhook/route.ts` - Handles org-specific webhook secrets

### 2. Stripe CLI Setup and Testing

- Installed Stripe CLI via winget
- Configured webhook listener for local development
- Added webhook secret to `.env`
- Tested webhook integration successfully (all events returned 200 OK)
- Updated README with Stripe setup instructions for local and production

### 3. Documentation Updates

- Added comprehensive Stripe setup instructions to README.md
- Includes local development (CLI) and production setup steps
- Test card numbers for development testing

---

## Previous Session Work

### Email Notifications Wired to Events
- Organization invites, application submitted/status, maintenance created/status

### Background Job Scheduler
- Payment status updates, rent reminders, late payment notifications, lease expiry reminders
- Runs daily at 8:00 AM (configurable)

### Renter/Maintenance Dashboard Sidebar Navigation
- Collapsible sidebars matching landlord design

### Mobile Responsiveness
- FAB hamburger menu, overlay, escape key handler

### File Uploads for Maintenance Tickets
- Drag-and-drop, preview thumbnails, 5MB limit

### Stripe Payment Integration
- Checkout sessions, webhooks, PayButton component

---

## What Needs To Be Done Next

### High Priority

1. **Document storage with S3/R2**
   - Integrate with AWS S3 or Cloudflare R2
   - Generate and store lease PDFs
   - Enable document uploads
   - Complexity: Medium | Value: High

2. **Advanced reporting with charts**
   - Revenue charts over time
   - Occupancy rate trends
   - Maintenance response time metrics
   - Complexity: Medium | Value: High

### Medium Priority

3. **OAuth dynamic providers**
   - Make per-org OAuth settings actually work for authentication
   - Requires NextAuth.js customization for dynamic providers
   - Complexity: High | Value: Medium

4. **Lease renewal workflow**
   - Auto-generate renewal offers
   - Digital signature integration
   - Renewal reminder notifications
   - Complexity: High | Value: High

5. **Push notifications** - Browser notifications for urgent items

### Lower Priority

6. **Admin panel** - Super-admin for platform management
7. **PWA support** - Progressive web app features
8. **Stripe Connect** - Payment splitting between PM/landlord
9. **Listing syndication** - Push to Zillow, Apartments.com

---

## Accessing Integration Settings

Navigate to: **Settings → Integrations** (visible only to org owners/admins)

URL: `/landlord/settings/integrations`

From there you can configure:
- **Stripe Payments**: Secret key, publishable key, webhook secret
- **Email (SMTP)**: Host, port, credentials, from address, app name
- **OAuth Providers**: Google and GitHub client ID/secret

---

## Demo Credentials

All demo users accept any password. Run `bun run db:seed` to populate.

| Role | Email | Organization |
|------|-------|--------------|
| Renter | alice.johnson@demo.com | Has active lease |
| Renter | jack.anderson@demo.com | No lease, pending apps |
| Landlord | john.properties@demo.com | Johnson Properties LLC |
| Landlord | sarah.realty@demo.com | Realty & Management Group |
| Landlord | mike.estates@demo.com | Premier Property Management |
| PM | pm.lisa@demo.com | Realty & Management Group |
| PM | pm.robert@demo.com | Premier Property Management |
| Maintenance | maint.joe@demo.com | Premier Property Management |

## Key Commands

```bash
# Development
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server

# Testing
bun run test         # Run tests (watch mode)
bun run test:run     # Run tests once

# Database
bun run db:push      # Apply schema changes
bun run db:seed      # Seed demo data
bun run db:studio    # Open Drizzle Studio

# Background Jobs
npm run scheduler       # Start scheduler daemon
npm run scheduler:once  # Run all jobs once

# Stripe (local development)
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## Environment Variables

```env
# Required
DATABASE_URL="file:./data/pms.db"
AUTH_SECRET="your-secret-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Email (optional - can configure via UI instead)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="noreply@your-domain.com"

# Stripe (optional - can configure via UI instead)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# OAuth (optional - can configure via UI instead)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
```

## Git Status

All changes committed and pushed to `main` branch.
