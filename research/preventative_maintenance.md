# Preventative Maintenance Scheduling Research

**Date**: 2026-01-13
**Status**: Research Complete - Awaiting Direction

## Overview

Build a comprehensive preventative maintenance system that:
1. Provides **templated schedules** for common maintenance tasks
2. Allows **custom schedules** for property-specific needs
3. Includes **calendar views** for scheduling
4. Sends **automated email reminders** to all parties

---

## Feature Requirements

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Maintenance Templates | Pre-built schedules for common tasks | High |
| Custom Schedules | User-defined tasks and frequencies | High |
| Calendar View | Visual scheduling interface | High |
| Email Reminders | Automated notifications | High |
| Assignment | Assign to workers or vendors | Medium |
| Completion Tracking | Mark done, track compliance | High |
| Recurring Tasks | Auto-generate future tasks | High |
| Tenant Notifications | Notify for property access | Medium |

---

## Part 1: Preventative Maintenance Templates

### Common Maintenance Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                PREVENTATIVE MAINTENANCE LIBRARY                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HVAC & Climate                    │  Plumbing                  │
│  ├── HVAC filter replacement       │  ├── Water heater flush    │
│  ├── HVAC tune-up (spring/fall)    │  ├── Check for leaks       │
│  ├── Thermostat battery            │  ├── Drain cleaning        │
│  └── Duct cleaning                 │  └── Hose bib winterize    │
│                                    │                             │
│  Exterior                          │  Safety                     │
│  ├── Gutter cleaning               │  ├── Smoke detector test   │
│  ├── Pressure washing              │  ├── CO detector test      │
│  ├── Roof inspection               │  ├── Fire extinguisher     │
│  ├── Window/door sealing           │  └── Dryer vent cleaning   │
│  └── Landscaping                   │                             │
│                                    │                             │
│  Appliances                        │  General                    │
│  ├── Refrigerator coil cleaning    │  ├── Pest control          │
│  ├── Dishwasher maintenance        │  ├── Deep cleaning         │
│  ├── Garbage disposal cleaning     │  └── Property inspection   │
│  └── Dryer lint cleaning           │                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Template Data Structure

```typescript
interface MaintenanceTemplate {
  id: string;
  name: string;                    // "HVAC Filter Replacement"
  category: string;                // "hvac", "plumbing", "exterior", etc.
  description: string;
  defaultFrequency: FrequencyType; // "monthly", "quarterly", "annually"
  estimatedDuration: number;       // minutes
  estimatedCost: number;           // cents
  requiresTenantAccess: boolean;
  seasonalPreference?: string[];   // ["spring", "fall"]
  applicablePropertyTypes: string[]; // ["single_family", "apartment"]
  checklistItems: string[];        // Step-by-step checklist
  isSystemTemplate: boolean;       // true = pre-built, false = custom
}

type FrequencyType =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'biannually'
  | 'annually'
  | 'custom';
```

### Pre-Built Templates

| Task | Frequency | Season | Est. Duration | Access Needed |
|------|-----------|--------|---------------|---------------|
| HVAC filter replacement | Monthly/Quarterly | Any | 15 min | Yes |
| HVAC tune-up | Biannually | Spring/Fall | 2 hours | Yes |
| Smoke detector test | Biannually | Any | 30 min | Yes |
| Gutter cleaning | Biannually | Spring/Fall | 2 hours | No |
| Water heater flush | Annually | Any | 1 hour | Yes |
| Pest control | Quarterly | Any | 30 min | Optional |
| Dryer vent cleaning | Annually | Any | 1 hour | Yes |
| Roof inspection | Annually | Spring | 1 hour | No |
| Fire extinguisher check | Annually | Any | 15 min | Yes |
| Pressure washing | Annually | Spring | 3 hours | No |

---

## Part 2: Scheduling System Architecture

### Database Schema

```sql
-- Maintenance schedule templates (reusable)
CREATE TABLE maintenance_templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,           -- 'monthly', 'quarterly', etc.
  frequency_interval INTEGER,        -- For custom: every X days
  estimated_duration INTEGER,        -- minutes
  estimated_cost INTEGER,            -- cents
  requires_tenant_access BOOLEAN DEFAULT false,
  seasonal_months TEXT,              -- JSON array: [3,4,9,10] for spring/fall
  checklist TEXT,                    -- JSON array of steps
  is_system_template BOOLEAN DEFAULT false,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Scheduled maintenance (applied to properties/units)
CREATE TABLE scheduled_maintenance (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),
  template_id TEXT REFERENCES maintenance_templates(id),
  property_id TEXT REFERENCES properties(id),
  unit_id TEXT REFERENCES units(id),  -- NULL = entire property

  -- Schedule details
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  next_due_date INTEGER NOT NULL,
  last_completed_date INTEGER,

  -- Assignment
  assigned_to TEXT REFERENCES users(id),
  vendor_name TEXT,                   -- External vendor if not staff
  vendor_contact TEXT,

  -- Notifications
  notify_days_before INTEGER DEFAULT 7,
  notify_tenant BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Individual maintenance tasks (generated from schedule)
CREATE TABLE maintenance_tasks (
  id TEXT PRIMARY KEY,
  scheduled_maintenance_id TEXT REFERENCES scheduled_maintenance(id),
  property_id TEXT REFERENCES properties(id),
  unit_id TEXT REFERENCES units(id),

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  due_date INTEGER NOT NULL,
  scheduled_date INTEGER,            -- Actual appointment date/time
  scheduled_time TEXT,               -- "09:00" - "11:00"

  -- Assignment
  assigned_to TEXT REFERENCES users(id),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'scheduled',  -- scheduled, in_progress, completed, skipped, overdue
  completed_at INTEGER,
  completed_by TEXT REFERENCES users(id),
  completion_notes TEXT,
  actual_cost INTEGER,

  -- Notifications sent
  reminder_sent_at INTEGER,
  tenant_notified_at INTEGER,

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Notification log for maintenance
CREATE TABLE maintenance_notifications (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES maintenance_tasks(id),
  recipient_type TEXT NOT NULL,      -- 'worker', 'landlord', 'tenant'
  recipient_id TEXT REFERENCES users(id),
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,   -- 'reminder', 'scheduled', 'completed'
  sent_at INTEGER NOT NULL,
  opened_at INTEGER
);
```

### Task Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TASK GENERATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │ Scheduled        │  Recurring schedule (e.g., quarterly)     │
│  │ Maintenance      │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ Daily Scheduler  │  Runs at midnight                         │
│  │ Job              │  Checks: next_due_date <= today + 30 days │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ Generate Task    │  Creates maintenance_task record          │
│  │                  │  Sets due_date from schedule              │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ Update Schedule  │  Calculates next_due_date                 │
│  │                  │  (e.g., +90 days for quarterly)           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Calendar & Scheduling UI

### Calendar View Options

#### Option A: Full Calendar (FullCalendar.io)

**Library**: `@fullcalendar/react`

```typescript
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

<FullCalendar
  plugins={[dayGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  events={maintenanceTasks}
  eventClick={handleTaskClick}
  dateClick={handleDateClick}
/>
```

**Pros:**
- Feature-rich (drag-drop, resize, multiple views)
- Well-maintained, popular
- Free for basic features

**Cons:**
- Larger bundle size
- Premium features require license ($499/year)

---

#### Option B: React Big Calendar

**Library**: `react-big-calendar`

```typescript
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

const localizer = momentLocalizer(moment);

<Calendar
  localizer={localizer}
  events={maintenanceTasks}
  startAccessor="start"
  endAccessor="end"
  onSelectEvent={handleTaskClick}
/>
```

**Pros:**
- Fully open source
- Google Calendar-like UI
- Good customization

**Cons:**
- Less polished than FullCalendar
- Requires moment.js

---

#### Option C: Custom Simple Calendar

Build a lightweight month view with our existing design system.

**Pros:**
- Smallest bundle size
- Full control over design
- No dependencies

**Cons:**
- More development time
- Less features initially

---

### Recommended: FullCalendar (Free Tier)

The free tier includes:
- Month/week/day views
- Event display
- Click handlers
- Responsive design

### Calendar UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│  Maintenance Calendar                    [+ Schedule Task]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ◀ January 2026 ▶                    [Month] [Week] [List]      │
│                                                                  │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                   │
│  │ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │                   │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│  │     │     │     │  1  │  2  │  3  │  4  │                   │
│  │     │     │     │     │     │     │     │                   │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│  │  5  │  6  │  7  │  8  │  9  │ 10  │ 11  │                   │
│  │     │     │ ░░░ │     │     │     │     │                   │
│  │     │     │HVAC │     │     │     │     │                   │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│  │ 12  │ 13  │ 14  │ 15  │ 16  │ 17  │ 18  │                   │
│  │     │ ░░░ │     │ ░░░ │     │     │     │                   │
│  │     │Pest │     │Smoke│     │     │     │                   │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│  │ 19  │ 20  │ 21  │ 22  │ 23  │ 24  │ 25  │                   │
│  │     │     │     │     │     │     │     │                   │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│  │ 26  │ 27  │ 28  │ 29  │ 30  │ 31  │     │                   │
│  │     │     │     │     │ ░░░ │     │     │                   │
│  │     │     │     │     │Gutter│    │     │                   │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                   │
│                                                                  │
│  Legend: ░ HVAC  ░ Safety  ░ Exterior  ░ Pest                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Task Scheduling Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Schedule Maintenance Task                              [X]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Template:    [HVAC Filter Replacement              ▼]          │
│               Or create custom task                             │
│                                                                  │
│  ─────────────────────────────────────────────────────          │
│                                                                  │
│  Property:    [Sunset Apartments                    ▼]          │
│  Unit:        [All Units                            ▼]          │
│                                                                  │
│  ─────────────────────────────────────────────────────          │
│                                                                  │
│  Schedule:    ◉ Recurring    ○ One-time                         │
│                                                                  │
│  Frequency:   [Quarterly                            ▼]          │
│  Start Date:  [01/15/2026]                                      │
│  Preferred Time: [9:00 AM - 12:00 PM                ▼]          │
│                                                                  │
│  ─────────────────────────────────────────────────────          │
│                                                                  │
│  Assign To:   [Joe Fix-It (Staff)                   ▼]          │
│               Or external vendor:                               │
│               Vendor Name: [                        ]           │
│               Contact:     [                        ]           │
│                                                                  │
│  ─────────────────────────────────────────────────────          │
│                                                                  │
│  Notifications:                                                  │
│  ☑ Remind assigned worker 7 days before                        │
│  ☑ Remind assigned worker 1 day before                         │
│  ☑ Notify tenant 3 days before (requires access)               │
│  ☑ Notify landlord when completed                              │
│                                                                  │
│  ─────────────────────────────────────────────────────          │
│                                                                  │
│              [Cancel]                    [Schedule Task]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Email Reminder System

### Notification Types

| Notification | Recipient | Timing | Content |
|--------------|-----------|--------|---------|
| Upcoming Task | Worker | 7 days before | Task details, property, checklist |
| Task Reminder | Worker | 1 day before | Reminder with directions |
| Access Required | Tenant | 3 days before | Date/time, what to expect |
| Task Scheduled | Landlord | On schedule | Confirmation of scheduling |
| Task Completed | Landlord | On completion | Summary, cost, notes |
| Task Overdue | Landlord/PM | 1 day after due | Alert to reschedule |

### Email Templates

#### Worker Reminder (7 Days)

```
Subject: Upcoming Maintenance: HVAC Filter Replacement - Jan 15

Hi Joe,

You have scheduled maintenance coming up:

📋 Task: HVAC Filter Replacement
🏠 Property: Sunset Apartments - All Units
📅 Due: January 15, 2026
⏱ Estimated Time: 15 minutes per unit

Checklist:
□ Turn off HVAC system
□ Remove old filter
□ Check filter size (20x25x1)
□ Install new filter
□ Turn system back on
□ Verify airflow

Tenant Access: Required
Contact tenants to schedule entry.

[View Task Details]  [Mark Complete]

---
This is an automated reminder from PropertyHub.
```

#### Tenant Access Notice

```
Subject: Scheduled Maintenance: HVAC Filter Replacement - Jan 15

Hi Alice,

Maintenance has been scheduled for your unit:

📋 What: HVAC Filter Replacement
📅 When: January 15, 2026 between 9:00 AM - 12:00 PM
👷 Who: Joe (Maintenance Staff)
⏱ Duration: Approximately 15 minutes

What to expect:
- Maintenance will need access to your unit
- They will be replacing the HVAC air filter
- Please ensure the area around your HVAC unit is accessible

If this time doesn't work, please contact us to reschedule.

[Confirm Access]  [Request Reschedule]

---
Sunset Apartments Management
```

### Scheduler Integration

```typescript
// src/scheduler/jobs/maintenanceReminders.ts

export async function sendMaintenanceReminders() {
  const db = getDb();
  const today = new Date();

  // Get tasks due in 7 days (first reminder)
  const tasksIn7Days = await db
    .select()
    .from(maintenanceTasks)
    .where(
      and(
        eq(maintenanceTasks.status, 'scheduled'),
        isNull(maintenanceTasks.reminderSentAt),
        between(
          maintenanceTasks.dueDate,
          addDays(today, 6),
          addDays(today, 8)
        )
      )
    );

  for (const task of tasksIn7Days) {
    // Send worker reminder
    if (task.assignedTo) {
      await sendWorkerReminderEmail(task, '7day');
      await db.update(maintenanceTasks)
        .set({ reminderSentAt: now() })
        .where(eq(maintenanceTasks.id, task.id));
    }
  }

  // Get tasks due tomorrow (final reminder)
  const tasksTomorrow = await db
    .select()
    .from(maintenanceTasks)
    .where(
      and(
        eq(maintenanceTasks.status, 'scheduled'),
        between(
          maintenanceTasks.dueDate,
          today,
          addDays(today, 2)
        )
      )
    );

  for (const task of tasksTomorrow) {
    await sendWorkerReminderEmail(task, '1day');

    // Notify tenant if access required
    if (task.requiresTenantAccess && !task.tenantNotifiedAt) {
      await sendTenantAccessEmail(task);
      await db.update(maintenanceTasks)
        .set({ tenantNotifiedAt: now() })
        .where(eq(maintenanceTasks.id, task.id));
    }
  }
}
```

---

## Part 5: Vendor/External Contractor Support

### Use Case

Some maintenance requires external vendors:
- Pest control companies
- HVAC contractors
- Roofing specialists
- Pool service

### Vendor Management

```sql
-- Vendor directory
CREATE TABLE vendors (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,          -- 'hvac', 'plumbing', 'pest', etc.
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_preferred BOOLEAN DEFAULT false,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Vendor Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    VENDOR NOTIFICATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Task assigned to external vendor                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────┐                                           │
│  │ Send Email to    │  Task details, property access info       │
│  │ Vendor           │  Requested date/time                      │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ Vendor Confirms  │  Email link to confirm/propose new time   │
│  │ Appointment      │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ Landlord + Tenant│  Confirmation sent to all parties        │
│  │ Notified         │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ Vendor Marks     │  Email link or portal access              │
│  │ Complete         │  Upload invoice/receipt                   │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Compliance & Reporting

### Maintenance Compliance Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Preventative Maintenance Compliance                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Overall Compliance: 87%  ████████████████░░░                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ By Category                                            │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │ HVAC              95%  █████████████████████░          │     │
│  │ Safety            100% ██████████████████████          │     │
│  │ Plumbing          80%  ████████████████░░░░            │     │
│  │ Exterior          75%  ███████████████░░░░░            │     │
│  │ Pest Control      90%  ██████████████████░░            │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Overdue Tasks                                     [3]  │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │ ⚠ Gutter Cleaning - Oak Street - Due Jan 5            │     │
│  │ ⚠ Water Heater Flush - Unit 201 - Due Jan 8           │     │
│  │ ⚠ Roof Inspection - Marina View - Due Jan 10          │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Upcoming This Week                                [12] │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │ ○ HVAC Filter - Sunset Apts - Jan 15 - Joe            │     │
│  │ ○ Pest Control - Valley Gardens - Jan 16 - Vendor     │     │
│  │ ○ Smoke Detector - Unit 301 - Jan 17 - Joe            │     │
│  │ ...                                                    │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Reports Available

| Report | Description |
|--------|-------------|
| Compliance Summary | % of scheduled tasks completed on time |
| Overdue Tasks | List of past-due maintenance |
| Cost Analysis | Actual vs estimated costs by category |
| Vendor Performance | Completion rates, avg cost by vendor |
| Property Health | Maintenance status by property |
| Annual Schedule | Year-at-a-glance of all scheduled tasks |

---

## Implementation Phases

### Phase 1: Core Scheduling (1 week)

**Goal**: Basic recurring task scheduling

**Tasks:**
1. Create database schema (templates, schedules, tasks)
2. Build template library (10-15 common tasks)
3. Create schedule management UI
4. Task generation scheduler job

**Files to Create:**
- `src/db/schema/maintenance.ts` (extend existing)
- `src/services/preventativeMaintenance.ts`
- `src/app/landlord/maintenance/schedule/page.tsx`
- `src/scheduler/jobs/generateMaintenanceTasks.ts`

---

### Phase 2: Calendar View (3-5 days)

**Goal**: Visual calendar interface

**Tasks:**
1. Install FullCalendar
2. Create calendar page
3. Task click/edit modals
4. Drag-drop rescheduling

**Files to Create:**
- `src/app/landlord/maintenance/calendar/page.tsx`
- `src/components/MaintenanceCalendar.tsx`

---

### Phase 3: Email Notifications (3-5 days)

**Goal**: Automated reminders

**Tasks:**
1. Create email templates
2. Add reminder scheduler jobs
3. Tenant access notifications
4. Completion notifications

**Files to Modify:**
- `src/services/email.ts`
- `src/scheduler/jobs/maintenanceReminders.ts`

---

### Phase 4: Vendor Management (1 week)

**Goal**: External contractor support

**Tasks:**
1. Vendor directory
2. Vendor assignment to tasks
3. Vendor confirmation workflow
4. Invoice/receipt upload

---

### Phase 5: Compliance Reporting (3-5 days)

**Goal**: Track and report on maintenance compliance

**Tasks:**
1. Compliance calculation service
2. Dashboard widgets
3. Exportable reports

---

## Cost Analysis

### Calendar Libraries

| Library | License | Cost |
|---------|---------|------|
| FullCalendar (Basic) | MIT | Free |
| FullCalendar Premium | Commercial | $499/year |
| React Big Calendar | MIT | Free |
| Custom Build | N/A | Dev time |

### Total Development Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Core Scheduling | 1 week | None |
| Phase 2: Calendar | 3-5 days | Phase 1 |
| Phase 3: Email | 3-5 days | Phase 1 |
| Phase 4: Vendors | 1 week | Phase 1 |
| Phase 5: Reporting | 3-5 days | Phase 1 |
| **Total** | **3-4 weeks** | |

---

## Questions for PM/Stakeholder

1. **Which templates should we include initially?**
   - Start with top 10 most common?
   - Allow landlords to request additions?

2. **Should tenants be able to confirm/request reschedule?**
   - Or just notification-only?
   - Self-service portal for tenants?

3. **Calendar integration priority?**
   - Google Calendar sync?
   - iCal export?
   - In-app only initially?

4. **Vendor management scope?**
   - Simple contact list?
   - Or full workflow with confirmations?

5. **Mobile app for maintenance workers?**
   - Or mobile-friendly web?
   - Offline checklist capability?

6. **Cost tracking depth?**
   - Just actual cost per task?
   - Or full budget vs actual by property?

7. **Multi-property scheduling?**
   - Schedule one task across all properties?
   - Or individual per property?

8. **Seasonal templates?**
   - Auto-suggest based on season?
   - Or manual scheduling only?

---

## Integration with Existing System

### Current Maintenance Module

We already have:
- `maintenance_requests` table (reactive maintenance)
- `maintenance_comments` table
- Maintenance worker role
- Email notification infrastructure

### How Preventative Fits In

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAINTENANCE SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │ REACTIVE            │      │ PREVENTATIVE        │          │
│  │ (Existing)          │      │ (New)               │          │
│  ├─────────────────────┤      ├─────────────────────┤          │
│  │ Tenant submits      │      │ Scheduled tasks     │          │
│  │ request             │      │ auto-generated      │          │
│  │                     │      │                     │          │
│  │ maintenance_requests│      │ maintenance_tasks   │          │
│  └──────────┬──────────┘      └──────────┬──────────┘          │
│             │                            │                      │
│             └────────────┬───────────────┘                      │
│                          │                                      │
│                          ▼                                      │
│             ┌─────────────────────┐                             │
│             │ Unified Calendar    │                             │
│             │ (Both types)        │                             │
│             └─────────────────────┘                             │
│                          │                                      │
│                          ▼                                      │
│             ┌─────────────────────┐                             │
│             │ Worker Assignment   │                             │
│             │ & Completion        │                             │
│             └─────────────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

| Feature | Complexity | Value | Recommendation |
|---------|------------|-------|----------------|
| Template Library | Low | High | Phase 1 |
| Recurring Schedules | Medium | High | Phase 1 |
| Calendar View | Medium | High | Phase 2 |
| Email Reminders | Low | High | Phase 3 |
| Vendor Management | Medium | Medium | Phase 4 |
| Compliance Reports | Low | Medium | Phase 5 |

**Recommendation**: Start with Phase 1-3 (core scheduling, calendar, emails) as these provide the most value. Vendor management and compliance can follow based on user feedback.

---

## References

- [FullCalendar React](https://fullcalendar.io/docs/react)
- [React Big Calendar](https://github.com/jquense/react-big-calendar)
- [Property Maintenance Checklist Templates](https://www.buildium.com/blog/rental-property-maintenance-checklist/)
- [HUD Inspection Checklist](https://www.hud.gov/program_offices/public_indian_housing/reac/products/pass/inspnaic)
