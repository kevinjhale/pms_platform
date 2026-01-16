# Tonight's Work - PM Feature Implementation

## Session Goal
Implement the PM (Property Manager) feature set, starting with the blocking issue.

---

## Priority Order

### 1. Issue #56 - Landlord UI to propose PM assignments (BLOCKER) - DONE
- [x] Add "Property Managers" section to property detail page (`/landlord/properties/[id]/page.tsx`)
- [x] Create assignment proposal form/modal component
- [x] Add server action to call `assignPropertyManager()` from services
- [x] Show current assignments with status (proposed/accepted/rejected)
- [x] Allow setting split percentage (0-100)

**Why first:** Without this, no assignments can be created in the database, blocking all other PM features.

---

### 2. Issue #51 - Verify PM assignment acceptance flow works - DONE
- [x] Test the existing `/landlord/assignments` page (already working)
- [x] Verify accept/reject actions work correctly (already working)
- [x] PM-side view exists at `/landlord/assignments` - PMs see their pending assignments
- [x] Added pending assignment count badge to sidebar Assignments link

---

### 3. Issue #57 - PM-specific notifications - DONE
- [x] Add notification when assignment is proposed to PM
- [x] Add notification when assignment is accepted/rejected (to landlord)
- [x] Maintenance notifications already covered (org members with manager/staff roles get notified)
- [x] Payment notifications deferred to Issue #53 (revenue tracking)

---

### 4. Issue #53 - PM revenue tracking
- [ ] Create revenue calculation service using `splitPercentage`
- [ ] Query payments for assigned properties
- [ ] Calculate PM's share based on accepted assignments
- [ ] Add revenue summary functions

---

### 5. Issue #58 - PM revenue dashboard
- [ ] Create `/pm/revenue` or `/manager/revenue` page
- [ ] Show total PM revenue (sum of splits)
- [ ] Monthly revenue trend chart
- [ ] Revenue by property breakdown
- [ ] CSV export functionality

---

### 6. Issue #50 - Full PM Dashboard
- [ ] Replace stub at `/app/manager/page.tsx`
- [ ] Show assigned properties count
- [ ] Show pending assignments
- [ ] Show revenue summary
- [ ] Show maintenance requests for assigned properties
- [ ] Reuse dashboard card components from landlord dashboard

---

## Notes

- PM users currently redirect to `/landlord` - need to decide if they should have separate routes or use landlord routes with filtered data
- The `propertyManagers` table schema already exists with `splitPercentage` field
- Service functions exist in `src/services/properties.ts` (lines 419-481)
- Assignment acceptance UI exists at `/landlord/assignments/`

---

## Progress Log

### Session 1 (2026-01-15)
- [x] Completed Issue #56 - Landlord UI to propose PM assignments
  - Created `PropertyManagersSection.tsx` - displays current PMs with status badges
  - Created `AssignManagerModal.tsx` - modal with user dropdown and split % input
  - Created `src/app/actions/pmAssignments.ts` - server action for assignments
  - Added `getPropertyManagersWithUsers()` to properties service
  - Updated property detail page to show PM section
- [x] Completed Issue #51 - Verify PM assignment acceptance flow
  - Verified existing `/landlord/assignments` page works correctly
  - Verified accept/reject actions work correctly
  - Added `getPendingAssignmentCount()` to properties service
  - Added red badge to sidebar Assignments link showing pending count
- [x] Completed Issue #57 - PM-specific notifications
  - Added `sendPMAssignmentProposedEmail()` - notifies PM when assigned
  - Added `sendPMAssignmentResponseEmail()` - notifies landlord when PM accepts/rejects
  - Added `getPropertyManagerAssignment()` service function
  - Maintenance notifications already covered by org member system
