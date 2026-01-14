# PMS Platform - Session Notes

**Last Updated**: 2026-01-13

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
- Property cards with visible borders and unit counts
- Rent Roll report with transposed table, utility jurisdictions, and monthly breakdown
- Comprehensive demo data for rent roll testing (24 months of payment history)
- Marketing site with Home, Features, Pricing, Contact pages
- Self-hosted license option ($229) with managed hosting plans
- Date range selector for reports (start/end month filtering)
- Optimized reports page (N+1 queries fixed, ~1.2s load time)
- Unified login (single sign-in for all user types)
- Configurable dashboard with drag-and-drop card system
- 19 card types across 4 categories (metrics, charts, lists, actions)
- Per-user dashboard configuration persistence
- **NEW: PM client relationships for multi-landlord management**
- **NEW: Unit templates for quick property setup**
- **NEW: Properties page table view with units as rows**
- Comprehensive testing framework (25 tests)
- Full documentation for setup and configuration
- Production deployment on DigitalOcean (halestormsw.com)

---

## What Was Done This Session (2026-01-13)

### PM Client Relationships - Multi-Landlord Management

Property managers can now work with multiple landlords, viewing and creating properties for different clients.

#### New Database Schema

| Table | Purpose |
|-------|---------|
| `pm_client_relationships` | Tracks PM-landlord relationships with permissions |

**Fields:**
- `pmUserId` - The property manager
- `landlordUserId` - On-platform landlord (nullable for external clients)
- `externalLandlordName/Email/Phone` - External client info
- `organizationId` - Which org properties belong to
- `canCreateProperties` - Permission flag
- `status` - active/inactive/pending
- `notes` - Relationship notes

#### New Files Created

| File | Purpose |
|------|---------|
| `src/services/pmClients.ts` | PM client management service |
| `src/components/ClientSelector.tsx` | Dropdown for filtering by client |

#### Modified Files

| File | Changes |
|------|---------|
| `src/db/schema/properties.ts` | Added `pm_client_relationships` table |
| `src/services/properties.ts` | Added `getAllUnitsForPm()`, `getUnitsForPmByClient()` |
| `src/app/landlord/properties/page.tsx` | Table view, client selector, PM filtering |
| `src/app/landlord/properties/new/page.tsx` | Client selection for PMs creating properties |
| `src/app/actions/properties.ts` | Handle client ID for property creation |
| `scripts/seed-demo-data.ts` | PM client relationships, landlordId on properties |

#### Features

- **Client Selector**: PMs see dropdown to filter by client or view all
- **Property Counts**: Each client shows how many properties they own
- **Create for Client**: PMs can create properties on behalf of clients
- **Permission Control**: `canCreateProperties` flag per relationship
- **External Clients**: Support for landlords not on the platform

#### Seed Data

Robert (pm.robert@demo.com) now has 4 client relationships:
- John Properties (landlord-1) - 2 properties, can create
- Mike Estates (landlord-3) - 2 properties, can create
- Sarah Realty (landlord-2) - 2 properties, view only
- Patricia Chen (external) - 0 properties, can create

---

### Unit Templates - Quick Property Setup

Added unit templates for quickly adding similar units with pre-filled values.

#### New Files Created

| File | Purpose |
|------|---------|
| `src/db/schema/unitTemplates.ts` | Template storage schema |
| `src/services/unitTemplates.ts` | Template CRUD operations |
| `src/app/actions/unitTemplates.ts` | Server actions for templates |
| `src/app/landlord/settings/templates/page.tsx` | Template management UI |
| `src/components/AddUnitForm.tsx` | Client component with template pre-fill |

#### Features

- Create reusable templates with bed/bath/sqft/rent/features
- Apply templates when adding new units
- Manage templates from Settings page
- Per-organization template isolation

---

### Properties Page - Table View

Changed properties display from cards to a table showing units as rows.

#### Changes

- Units displayed as individual rows with property as a column
- Columns: Property, Unit, Bed/Bath, Sq Ft, Rent, Status, Actions
- Property names link to property detail page
- Status badges with color coding
- Edit button for each unit

---

### GitHub Issues Created

- **#59**: Dashboard Phase 3 - per-card filters and date range selectors
- **#60**: CSV bulk import for properties
- **#61**: Allow users to have multiple roles

---

### Research Documents Created

Conducted comprehensive research on four major feature areas based on client feedback. All documents saved in `research/` directory.

#### 1. Payment Processing (`research/payment_processing.md`)

**Problem**: Client accepts Zelle, CashApp, Venmo, PayPal, QuickBooks - wants flexible payment options with payment splitting.

**Key Findings**:
- P2P apps (Zelle, Venmo, CashApp) have no merchant APIs - can't automate
- Stripe Connect with ACH is best for automated splitting (~$5 max fee)
- Recommended: Hybrid approach with 3 tiers:
  1. Automated (Stripe Connect)
  2. Semi-automated (PayPal/Venmo via PayPal Commerce)
  3. Manual recording (Zelle, CashApp, checks)

**7 questions for PM** on automation vs flexibility, fee handling, QuickBooks integration.

---

#### 2. Automated Notices (`research/notices.md`)

**Problem**: Need to automate late rent notices and eviction notices via email and certified mail.

**Key Findings**:
- Email reminders: 6-stage timeline (5 days before → delinquent)
- Certified mail: **Lob** recommended (~$6-8/letter, excellent API)
- Process servers: ABC Legal has API for hand-delivery ($50-150/service)
- State-specific templates required for legal compliance

**Implementation Phases**:
1. Email automation (2-3 days)
2. PDF notice generation (1 week)
3. Certified mail integration (1-2 weeks)
4. Process server integration (optional)

**7 questions for PM** on states to support, automation level, approval workflow.

---

#### 3. Lease Management (`research/lease_management.md`)

**Problem**: After DocuSign signing, must manually re-enter all lease data into app.

**Key Findings**:
- **Recommended**: Generate lease in-app → send for e-signature → auto-activate on completion
- E-signature comparison:
  - HelloSign: $25/mo, excellent API (recommended)
  - BoldSign: $99/mo flat, unlimited (best for volume)
  - DocuSign: $65/mo, industry standard
- AI parsing (GPT-4, Textract) available for legacy lease import

**Implementation Phases**:
1. Lease builder UI (1 week)
2. E-signature integration (1-2 weeks)
3. Auto-activation on signature (3-5 days)
4. Template builder (optional, 2-3 weeks)

**8 questions for PM** on e-sign platform, state templates, renewal automation.

---

#### 4. Preventative Maintenance (`research/preventative_maintenance.md`)

**Problem**: Need scheduled/recurring maintenance with calendar and email reminders.

**Key Findings**:
- 15+ pre-built templates (HVAC, plumbing, safety, pest, exterior)
- Frequency options: weekly → annually, seasonal support
- Calendar: FullCalendar (free tier) recommended
- Email reminders to workers (7 days, 1 day), tenants (access notice), landlords (completion)
- Vendor management for external contractors

**Implementation Phases**:
1. Core scheduling (1 week)
2. Calendar view (3-5 days)
3. Email notifications (3-5 days)
4. Vendor management (1 week)
5. Compliance reporting (3-5 days)

**Total: 3-4 weeks**

**8 questions for PM** on templates, tenant self-service, Google Calendar sync.

---

### Previous: Configurable Dashboard Card System

Built a fully customizable dashboard where property managers can add, remove, resize, and reorder cards showing various metrics, charts, and lists.

#### New Files Created

| File | Purpose |
|------|---------|
| `src/db/schema/dashboard.ts` | Database schema for per-user dashboard configs |
| `src/lib/dashboard/cardTypes.ts` | Card type definitions with metadata and data requirements |
| `src/services/dashboard.ts` | Dashboard service (CRUD, smart data fetching) |
| `src/app/api/dashboard/config/route.ts` | API route for saving/loading dashboard config |
| `src/components/dashboard/DashboardGrid.tsx` | Main grid with @dnd-kit drag-and-drop |
| `src/components/dashboard/DashboardCard.tsx` | Card wrapper with resize/remove controls |
| `src/components/dashboard/AddCardModal.tsx` | Modal for adding new cards |
| `src/components/dashboard/cards/MetricCard.tsx` | Single-stat metric card renderer |
| `src/components/dashboard/cards/ChartCards.tsx` | Chart cards (revenue, occupancy, payment status, maintenance) |
| `src/components/dashboard/cards/ListCards.tsx` | List cards (maintenance, leases, payments, applications, properties, vacants) |
| `src/components/dashboard/cards/QuickActionsCard.tsx` | Quick action shortcuts card |
| `src/components/dashboard/cards/index.tsx` | Card content renderer registry |
| `src/app/landlord/dashboard/page.tsx` | Dashboard page (server component) |
| `src/app/landlord/dashboard/DashboardContent.tsx` | Dashboard client component |

#### Card Types (19 total)

**Metrics (9):**
- Occupancy Rate, Total Units, Monthly Revenue, Collection Rate
- Open Maintenance, Pending Applications
- Expiring Leases (30 days), Expiring Leases (90 days), Outstanding Balance

**Charts (4):**
- Revenue Trend (bar chart, 6 months)
- Occupancy Chart (pie - occupied vs vacant)
- Payment Status (pie - current/partial/delinquent)
- Maintenance by Category (pie)

**Lists (6):**
- Recent Maintenance, Upcoming Lease Expirations
- Overdue Payments, Recent Applications
- Properties List, Vacant Units

**Actions (1):**
- Quick Actions (shortcuts to common tasks)

#### Features

- **Drag-and-Drop Reordering**: Using @dnd-kit library
- **Card Resizing**: +W/-W and +H/-H controls in edit mode
- **Per-User Persistence**: Each user has their own dashboard layout
- **Smart Data Fetching**: Only fetches data required by active cards
- **Default Dashboard**: Sensible defaults for new users
- **4-Column Grid**: Responsive layout (cards span 1-4 columns, 1-3 rows)
- **Edit Mode**: Toggle to customize, with save/cancel flow
- **Error Handling**: User feedback on save failures

#### Dependencies Added

- `@dnd-kit/core@6.3.1`
- `@dnd-kit/sortable@10.0.0`
- `@dnd-kit/utilities@3.2.2`

#### Modified Files

| File | Changes |
|------|---------|
| `src/db/schema/index.ts` | Export dashboard schema |
| `src/app/landlord/page.tsx` | Redirect to /landlord/dashboard instead of /landlord/reports |
| `src/components/LandlordSidebar.tsx` | Dashboard link points to /landlord/dashboard |
| `CLAUDE.md` | Updated bun usage requirements and agent usage instructions |

#### Phase 3 Features (Planned)

- Per-card date range selector for time-based reports
- Property dropdown filter for property-specific cards
- Card configuration modal for custom settings

#### Navigation

Dashboard is now the default landing page for landlords/managers:
- **URL**: `/landlord/dashboard`
- **Sidebar**: Dashboard link at top

---

## What Was Done Previous Session (2026-01-10)

### Marketing Site - Complete Implementation

Built a full marketing site with navigation and multiple pages for public-facing content.

#### New Files Created

| File | Purpose |
|------|---------|
| `src/app/features/page.tsx` | Features page with categorized feature list |
| `src/app/pricing/page.tsx` | Pricing page with self-hosted license + managed hosting |
| `src/app/contact/page.tsx` | Contact form with company info |

#### Modified Files

| File | Changes |
|------|---------|
| `src/components/Navbar.tsx` | Added marketing nav links (Home, Features, Pricing, Contact) for non-logged-in users |
| `src/app/page.tsx` | Complete redesign with hero, stats, user types, CTA, footer |
| `src/app/layout.tsx` | Updated site metadata (title, description) |

#### Pricing Structure

**Self-Hosted License** (one-time purchase):
- $229 one-time payment
- Full source code access
- Unlimited units & users
- All features included
- Community support via GitHub
- Updates for current major version
- $50 to upgrade to any future major version

**Managed Hosting** (monthly):
- Starter: $0/mo (up to 5 units)
- Professional: $29/mo (up to 25 units) - Most Popular
- Enterprise: $79/mo (unlimited units)

---

### Login Simplification

Consolidated the login flow to a single entry point.

#### Changes
- Removed separate "Renter Login" and "Landlord & Manager Login" cards from homepage
- Added single "Sign In" button that routes to unified `/login` page
- Role-based redirect already handled by `/dashboard/page.tsx`:
  - `renter` → `/renter`
  - `maintenance` → `/maintenance`
  - `landlord/manager` → `/landlord`

---

### Reports Page Optimization

Fixed performance issues with the reports dashboard.

#### N+1 Query Fixes

| Service Function | Before | After | Change |
|-----------------|--------|-------|--------|
| `getRentRoll()` | 19 queries | 3 queries | Batch fetch with `inArray()` |
| `getMonthlyPayments()` | 12 queries | 1 query | Single query, group in JS |
| `getRevenueHistory()` | 6 queries | 1 query | Single query with date range |

**Result**: Page load improved from 10-37 seconds to ~1.2 seconds

#### Date Range Selector

Added flexible date filtering to reports:

| Feature | Implementation |
|---------|----------------|
| Start/End dropdowns | Combined month-year selector |
| Quick presets | This Month, Last 3/6/12 Mo, YTD |
| URL params | `?startMonth=1&startYear=2025&endMonth=6&endYear=2025` |
| 24 months history | Seed data extended to cover 24 months |

**Modified Files:**
- `src/components/MonthYearSelector.tsx` → Rewritten as `DateRangeSelector`
- `src/services/reports.ts` → All metrics functions accept date range params
- `src/services/rentRoll.ts` → Optimized queries with batch fetching
- `src/app/landlord/reports/page.tsx` → URL param handling for date range
- `scripts/seed-demo-data.ts` → Extended to 24 months of payment history

---

### Docker/Deployment Fixes

Fixed production deployment issues.

| Issue | Fix |
|-------|-----|
| `bun install --frozen-lockfile` failing | Changed to `bun install` (without flag) |
| Seed command failing | Clarified service name is "web" not "app" |

**Deployment commands:**
```bash
ssh root@halestormsw.com
cd /root/pms_platform
git pull
docker compose up -d --build
docker compose exec web npx tsx scripts/seed-demo-data.ts
```

---

## What Was Done Previous Session (2026-01-09)

### Rent Roll Report - Complete Implementation

Built the core financial report for property management - the Rent Roll. This is the primary document the first users (a company acting as both landlords and property managers) will use.

#### Schema Changes

**New/Updated Tables:**
| Table | Changes |
|-------|---------|
| `properties` | Added `apn`, `utilityWater`, `utilityTrash`, `utilityElectricity` |
| `units` | Added `listedDate` |
| `users` | Added `phone` |
| `leases` | Added `coSignerName/Email/Phone`, `paymentStatus`, `cleaningFee` |
| `leaseCharges` | **NEW** - Recurring charges (water, trash, electricity, parking, pet fees) |
| `paymentLineItems` | **NEW** - Payment breakdown by category for each payment period |

#### New Files Created

| File | Purpose |
|------|---------|
| `src/services/rentRoll.ts` | Service for rent roll data with charges and balances |
| `src/app/landlord/reports/rent-roll/page.tsx` | Transposed rent roll table with monthly breakdown |

#### Rent Roll Features

- **Transposed table layout** - Fields as rows, entries as columns
- **Sticky first column** - Field labels always visible when scrolling
- **Large horizontal scrollbar** (16px) - Always visible for easy navigation
- **Section separators** - Bold borders between Property/Tenant, Phone/Rent, Status/Dates
- **Utility jurisdiction rows** - Water, Trash, Electricity providers under APN (indented sub-rows)
- **Clickable property names** - Links to property detail page
- **Color-coded payment status** - Current (green), Partial (yellow), Delinquent (red)
- **Monthly payment breakdown table** - Shows payments for each month with YTD totals
- **Summary cards** - Total units, monthly rent, total charges, outstanding balance

#### Fields Displayed

**Property Section:**
- Property (clickable link)
- Address
- APN
  - Water (utility provider)
  - Trash (utility provider)
  - Electricity (utility provider)
- Unit

**Tenant Section:**
- Tenant name
- Co-Signer
- Email (both tenant and co-signer)
- Phone (both tenant and co-signer)

**Financial Section:**
- Rent
- Water & Trash
- Electricity
- Total Monthly
- Security Deposit
- Cleaning Fee
- Current Balance
- Status

**Dates Section:**
- Listed Date
- Lease Start
- Lease End

#### Demo Data Seeded

| Data Type | Count | Details |
|-----------|-------|---------|
| User phones | 17 | All users now have phone numbers |
| Property APNs | 6 | Assessor Parcel Numbers for each property |
| Utility providers | 6x3 | Water, Trash, Electricity for each property |
| Unit listed dates | 20 | Realistic dates based on occupancy |
| Co-signers | 4 | 4 of 9 leases have co-signer info |
| Lease charges | 22 | Water/trash, electricity, gas, parking, pet fees |
| Payment line items | 171 | Monthly breakdown by category |

#### Navigation

Added "Rent Roll" to Reports submenu in sidebar: **Reports → Rent Roll**

#### Outstanding TODOs

- [ ] **Pet Fee row** - Add Pet Fee field under Cleaning Fee (pull from `leaseCharges` where `category === 'pet_fee'`)

---

### Property Manager (PM) Code Audit (Earlier This Session)

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
