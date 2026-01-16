# PMS Platform - Session Notes

**Last Updated**: 2026-01-15

## Project Overview

Property Management System (PMS) - a multi-tenant platform for landlords, property managers, renters, and maintenance workers built with Next.js 16, Drizzle ORM, and SQLite.

---

## Current State

**Core Features:**
- Multi-role support (users can have multiple platform roles simultaneously)
- Role-based access without role switching (all content visible based on all roles)
- Team management (invite members, edit roles, remove members)
- PM client relationships for multi-landlord management
- CSV bulk import for properties and units
- Configurable dashboard with 19 card types (drag-and-drop, resizable)
- Rent Roll report with transposed table and monthly breakdown
- Per-organization integration settings (Stripe, SMTP, OAuth)
- Stripe payment integration with webhooks
- Email notifications with background job scheduler
- File uploads for maintenance tickets with photo gallery
- Marketing site (Home, Features, Pricing, Contact)
- Mobile responsive with collapsible sidebars

**Production**: Deployed on DigitalOcean (halestormsw.com)

---

## What Was Done This Session (2026-01-15)

### Multi-Role System (Issue #61 - Closed)

- Users can have multiple platform roles (e.g., landlord + manager)
- Removed role switching - users see ALL content for ALL their roles
- Route protection uses `hasRole()` check instead of active role
- Dashboard routing priority: landlord/manager > maintenance > renter

### Team Management

- Added `EditMemberButton` - dropdown to change member org role
- Added `RemoveMemberButton` - remove members with confirmation
- Server actions: `updateMemberRoleAction()`, `removeMemberAction()`
- Permission matrix: Owners can do all, Admins can edit/remove (except owners/other admins)

### Settings Page Enhancements

- **My Platform Roles**: Shows each role with organization name inline
- **My Clients**: Shows PM client relationships (for users with manager role)
  - Client name, organization, property count
  - Permission badges (Can Create / View Only)
  - External client indicator

**Commits**: `bceacc9`, `9548484`, `2b0ff78`, `0b5e603`, `29082fa`

---

## Recent Features (Summary)

| Feature | Date | Notes |
|---------|------|-------|
| CSV Bulk Import | 01-15 | Multi-step wizard, papaparse, PM client support |
| Sidebar Simplification | 01-15 | Direct links, removed submenus |
| PM Client Relationships | 01-13 | `pm_client_relationships` table, client selector |
| Unit Templates | 01-13 | Reusable templates for quick unit setup |
| Properties Table View | 01-13 | Units as rows instead of property cards |
| Configurable Dashboard | 01-10 | 19 card types, @dnd-kit, per-user persistence |
| Marketing Site | 01-10 | Home, Features, Pricing ($229 self-hosted), Contact |
| Reports Optimization | 01-10 | N+1 fixes, ~1.2s load time, date range selector |
| Rent Roll Report | 01-09 | Transposed table, utility jurisdictions, monthly breakdown |
| Photo Gallery | 01-08 | Lightbox viewer for maintenance tickets |
| Integration Settings | 01-07 | Per-org Stripe/SMTP/OAuth, encrypted storage |

---

## Research Documents

Four research docs in `research/` directory covering planned features:
- **payment_processing.md** - Hybrid payment approach (Stripe + manual recording)
- **notices.md** - Automated late/eviction notices via Lob API
- **lease_management.md** - In-app lease generation with e-signature
- **preventative_maintenance.md** - Scheduled maintenance with calendar

---

## GitHub Issues

| Issue | Status | Description |
|-------|--------|-------------|
| #59 | Open | Dashboard Phase 3 - per-card filters |
| #60 | Closed | CSV bulk import |
| #61 | Closed | Multiple roles per user |

---

## Demo Credentials

All demo users accept any password. Run `npx tsx scripts/seed-demo-data.ts` to populate.

| Role | Email | Notes |
|------|-------|-------|
| Renter | alice.johnson@demo.com | Has active lease |
| Landlord | john.properties@demo.com | Johnson Properties LLC |
| Landlord | sarah.realty@demo.com | Dual role (landlord + manager) |
| PM | pm.robert@demo.com | Dual role (manager + landlord), 4 clients |
| Maintenance | maint.joe@demo.com | Premier Property Management |

**Multi-Role Users:**
- `sarah.realty@demo.com` - Landlord + Manager
- `pm.robert@demo.com` - Manager + Landlord (owns Robert's Duplex, manages for 4 clients)

---

## Key Commands

```bash
# Development
bun run dev              # Start dev server (or: npx next dev)
bun run build            # Build for production

# Database
npx tsx scripts/seed-demo-data.ts  # Seed demo data
bun run db:push          # Apply schema changes
bun run db:studio        # Open Drizzle Studio

# Background Jobs
npm run scheduler        # Start scheduler daemon

# Stripe (local)
stripe listen --forward-to localhost:3000/api/payments/webhook
```

---

## Environment Variables

```env
# Required
DATABASE_URL="file:./data/pms.db"
AUTH_SECRET="your-secret-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Optional (can configure via Settings > Integrations)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
SMTP_HOST="smtp.gmail.com"
SMTP_USER=""
SMTP_PASS=""
```

---

## What Needs To Be Done Next

1. **Document storage** - S3/R2 for lease PDFs and uploads
2. **Lease renewal workflow** - Auto-generate offers, e-signature
3. **Push notifications** - Browser notifications for urgent items
4. **Stripe Connect** - Payment splitting between PM/landlord

---

## Deployment

```bash
ssh root@halestormsw.com
cd /root/pms_platform
git pull
docker compose up -d --build
docker compose exec web npx tsx scripts/seed-demo-data.ts
```
