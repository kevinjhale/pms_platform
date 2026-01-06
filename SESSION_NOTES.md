# PMS Platform - Session Notes

**Last Updated**: 2026-01-05

## Project Overview

Property Management System (PMS) - a multi-tenant platform for landlords, property managers, renters, and maintenance workers built with Next.js 16, Drizzle ORM, and SQLite.

## Current State

All issues from `20260104515notesforclaude.md` have been addressed and the corresponding GitHub issues closed.

### Completed Work

| Issue | Description | Commit |
|-------|-------------|--------|
| #41 | Middleware deprecation warning | Migrated `middleware.ts` → `proxy.ts` |
| #42 | Renter routing to wrong dashboard | Renters skip org check, go to `/renter` |
| #43 | Onboarding missing user type selection | Created `/select-role` page |
| #44 | No application workflow | Already existed - closed |
| #45 | No demo listings | Seed script creates available units |
| #46 | Property form Client Component error | Extracted delete button to client component |
| #47 | Consolidate maintenance pages | Already correct pattern - closed |
| #48 | Comprehensive demo data | Created seed script |
| #49 | Maintenance worker actor | New dashboard at `/maintenance` |

### Recent Commits

```
3dd139a chore: add db:seed script for demo data
73e75f3 feat: add maintenance worker dashboard and ticket management
9621d67 feat: add comprehensive demo data with seed script
b8fa6ff fix: remove confusing user type question from onboarding
52dc3d3 feat: add user role selection page for new OAuth users
73c2651 fix: route renters directly to renter dashboard, skip org check
def95c1 fix: migrate middleware.ts to proxy.ts for Next.js 16
6b3fe35 fix: extract delete button to client component to resolve onClick error
```

## Demo Credentials

All demo users accept any password.

### Renters (10)
- alice.johnson@demo.com (has active lease)
- bob.smith@demo.com (has active lease)
- carol.williams@demo.com (has active lease)
- david.brown@demo.com (has active lease)
- emma.davis@demo.com (has active lease)
- frank.miller@demo.com (has active lease)
- grace.wilson@demo.com (has active lease)
- henry.moore@demo.com (has active lease)
- iris.taylor@demo.com (has active lease)
- jack.anderson@demo.com (no lease, has pending applications)

### Landlords (3)
- john.properties@demo.com → Johnson Properties LLC (org-landlord-only)
- sarah.realty@demo.com → Realty & Management Group (org-landlord-pm)
- mike.estates@demo.com → Premier Property Management (org-pm-only)

### Property Managers (3)
- pm.lisa@demo.com → Realty & Management Group
- pm.robert@demo.com → Premier Property Management (owner)
- pm.maria@demo.com → Premier Property Management

### Maintenance Worker (1)
- maint.joe@demo.com → Premier Property Management (staff)

## Key Commands

```bash
# Development
bun run dev

# Database
bun run db:push     # Apply schema changes
bun run db:seed     # Seed demo data
bun run db:studio   # Open Drizzle Studio

# Build
bun run build
bun run start
```

**Note**: Project uses `bun` as the package manager (configured in `claude.md`).

## Architecture Notes

### User Roles (Platform-level)
- `renter` → `/renter` dashboard
- `landlord` → `/landlord` dashboard (requires organization)
- `manager` → `/landlord` dashboard (requires organization)
- `maintenance` → `/maintenance` dashboard

### Organization Roles (Per-org)
- `owner`, `admin`, `manager`, `staff`

### Key Files Changed

- `src/proxy.ts` - Route protection (was middleware.ts)
- `src/app/dashboard/page.tsx` - Role-based routing
- `src/app/select-role/page.tsx` - New OAuth user role selection
- `src/app/maintenance/` - Maintenance worker dashboard
- `src/services/maintenance.ts` - Added worker-specific queries
- `src/db/schema/users.ts` - Added `role` column and `maintenance` enum
- `scripts/seed-demo-data.ts` - Comprehensive demo data

## Potential Next Steps

1. **Testing**: Add integration tests for the new flows
2. **UI Polish**: Improve styling consistency across dashboards
3. **Notifications**: Add email notifications for applications/maintenance
4. **File Uploads**: Enable photo uploads for maintenance tickets
5. **Payments**: Integrate Stripe for rent payments
6. **Reports**: Expand reporting/analytics features

## Files to Review

- `20260104515notesforclaude.md` - Original issue notes (can be deleted)
- `SESSION_NOTES.md` - This file (update or delete when done)

## Session Updates (2026-01-05)

- Switched package manager from `npm` to `bun`
- Updated `claude.md` with bun usage instructions
- Development environment verified: Node.js v24.12.0, Git 2.40.1, VS Code 1.93.1, Bun installed

## Git Status

All changes committed and pushed to `main` branch. No uncommitted work.
