# Automated Notices Research

**Date**: 2026-01-13
**Status**: Research Complete - Awaiting Direction

## Context

Need to automate:
1. **Payment reminder emails** - Upcoming, late, and delinquent rent
2. **Late rent notices** - Formal written notice of non-payment
3. **Eviction notices** - Legal notices requiring certified mail or hand delivery

---

## Part 1: Email Automation for Payment Reminders

### Current System Capabilities

Our platform already has:
- Email infrastructure (`src/services/email.ts`)
- Background job scheduler (`src/scheduler/`)
- Payment tracking with status (current, partial, delinquent)
- Lease data with rent due dates

### Proposed Email Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT REMINDER TIMELINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Day -5    Day -3    Day 1     Day 3     Day 5     Day 10+      │
│    │         │         │         │         │         │          │
│    ▼         ▼         ▼         ▼         ▼         ▼          │
│ ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐           │
│ │ 5-Day│  │ 3-Day│  │ Due  │  │ Late │  │Grace│  │Delin-│        │
│ │Remind│  │Remind│  │Today │  │Notice│  │ End │  │quent │        │
│ └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘           │
│                                                                  │
│ Friendly  Friendly   Urgent   Warning   Final    Escalation     │
│                               + Fee     Warning  to Landlord    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Email Templates Needed

| Trigger | Timing | Tone | Content |
|---------|--------|------|---------|
| Upcoming Reminder | 5 days before | Friendly | "Your rent of $X is due on [date]" |
| Final Reminder | 3 days before | Friendly | "Reminder: rent due in 3 days" |
| Due Today | Day of | Neutral | "Your rent is due today" |
| Late Notice | 1-3 days after | Formal | "Your rent is past due. Late fee of $X applied." |
| Grace Period Ending | 5 days after | Warning | "Grace period ends tomorrow. Pay to avoid further action." |
| Delinquent | 10+ days | Serious | "Your account is delinquent. Contact us immediately." |
| Escalation | 14+ days | Final | Notify landlord/PM to take manual action |

### Implementation Approach

**Option A: Extend Existing Scheduler**
- Add new job types to `src/scheduler/jobs/`
- Use existing email service
- Low complexity, 1-2 days

**Option B: Event-Driven with Queues**
- Use a job queue (BullMQ, Agenda)
- Schedule emails when payment record created
- More scalable, medium complexity

### Landlord Configuration Options

```
Email Notification Settings
─────────────────────────────────────────
Reminder Emails
  ☑ 5 days before due date
  ☑ 3 days before due date
  ☑ Day of due date

Late Payment Emails
  ☑ 1 day after (with late fee notice)
  ☑ End of grace period warning
  ☑ Delinquent notice (10+ days)

Escalation
  ☑ Notify me when tenant is 14+ days late
  ☑ Auto-generate formal late notice
```

---

## Part 2: Certified Mail Automation

### Legal Requirements for Eviction Notices

Eviction notices typically require **proof of delivery**. Acceptable methods vary by state:

| Method | Legal Standing | Automation Possible |
|--------|---------------|---------------------|
| Certified Mail (USPS) | High - return receipt | Yes |
| Hand Delivery + Witness | High - affidavit | Partial (scheduling) |
| Posting on Door | Medium - varies by state | No |
| Process Server | High - professional | Yes (API services) |
| Electronic (some states) | Emerging - limited | Yes |

### Certified Mail Automation Services

#### 1. Lob (Recommended)

**Website**: https://www.lob.com

**Features:**
- REST API for sending physical mail
- Certified mail with return receipt
- USPS tracking integration
- Webhook notifications for delivery status
- Address verification
- Template management

**Pricing:**
- Letters: $0.65 - $1.50 per piece
- Certified Mail: ~$5-8 per piece (includes return receipt)
- Volume discounts available

**Integration Example:**
```javascript
// Send certified mail via Lob API
const letter = await lob.letters.create({
  to: tenantAddress,
  from: landlordAddress,
  file: '<html>Late Rent Notice...</html>',
  mail_type: 'usps_first_class',
  extra_service: 'certified',
  return_envelope: true,
});
// Returns tracking number and delivery webhooks
```

**Pros:**
- Well-documented API
- Reliable delivery tracking
- Legal-grade certified mail
- PDF or HTML templates

**Cons:**
- Cost per piece
- 2-5 day delivery time

---

#### 2. Click2Mail

**Website**: https://click2mail.com

**Features:**
- USPS certified mail
- API and batch upload
- Return receipt electronic (lower cost)
- Affidavit of mailing available

**Pricing:**
- Certified with electronic return receipt: ~$4.50
- Physical return receipt: ~$7.00

**Pros:**
- Lower cost than Lob
- Affidavit services

**Cons:**
- Older API design
- Less developer-friendly

---

#### 3. PostGrid

**Website**: https://www.postgrid.com

**Features:**
- Modern REST API
- Certified mail support
- Address verification
- Webhook delivery notifications
- Canadian + US mail

**Pricing:**
- Similar to Lob
- Pay-as-you-go or monthly plans

---

#### 4. Stamps.com / Endicia

**Features:**
- API access for certified mail
- USPS integration
- Batch processing

**Cons:**
- More enterprise-focused
- Complex onboarding

---

### Process Server Automation

For hand-delivery requirements, some services offer API-based process serving:

#### ABC Legal (ServeNow)

**Website**: https://www.abclegal.com

**Features:**
- Nationwide process server network
- API for job submission
- Proof of service documents
- GPS-verified delivery

**Use Case:**
- Submit eviction notice via API
- Process server hand-delivers
- Receive affidavit of service electronically

**Pricing:** $50-150 per service (varies by location)

---

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTICE DELIVERY SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │ Generate     │                                               │
│  │ Notice PDF   │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐     ┌─────────────────────────────────┐       │
│  │ Delivery     │────▶│  Email (immediate)              │       │
│  │ Router       │     └─────────────────────────────────┘       │
│  │              │     ┌─────────────────────────────────┐       │
│  │              │────▶│  Certified Mail (Lob API)       │       │
│  │              │     │  - 2-5 day delivery             │       │
│  │              │     │  - Tracking webhook             │       │
│  │              │     └─────────────────────────────────┘       │
│  │              │     ┌─────────────────────────────────┐       │
│  │              │────▶│  Process Server (ABC Legal)     │       │
│  │              │     │  - Hand delivery                │       │
│  │              │     │  - Affidavit returned           │       │
│  └──────────────┘     └─────────────────────────────────┘       │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Audit Log    │  Track all delivery attempts + confirmations  │
│  │ + Timeline   │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 3: State-Specific Legal Requirements

### Notice Periods by State (Examples)

| State | Pay or Quit Notice | Cure Period | Delivery Methods |
|-------|-------------------|-------------|------------------|
| California | 3 days | None | Personal, substituted, posting + mail |
| Texas | 3 days | None | Personal, mail, posting |
| Florida | 3 days | None | Personal, mail, posting |
| New York | 14 days | Varies | Personal, substituted, conspicuous posting |
| Illinois | 5 days | None | Personal, certified mail |
| Georgia | Immediate | None | Personal, posting |

### Compliance Considerations

1. **Notice Content Requirements**
   - Must include specific language per state
   - Amount owed, cure period, consequences
   - Landlord contact information

2. **Delivery Proof**
   - Certified mail provides USPS tracking + signature
   - Hand delivery requires witness affidavit
   - Some states require multiple attempts

3. **Timing Rules**
   - Some states exclude weekends/holidays
   - Count starts day after delivery
   - Must wait full period before filing

### Recommendation: State-Specific Templates

Build a template system with:
- State selector for notice generation
- Pre-filled legal language per state
- Automatic calculation of cure dates
- Delivery method recommendations per state

---

## Part 4: Implementation Recommendations

### Phase 1: Email Automation (Low Complexity)

**Timeline**: 2-3 days

**Tasks:**
1. Create email templates for each reminder type
2. Add scheduler jobs for payment reminders
3. Add landlord configuration for notification preferences
4. Track email delivery status

**Files to Create/Modify:**
- `src/scheduler/jobs/paymentReminders.ts`
- `src/services/email.ts` (add templates)
- `src/app/landlord/settings/notifications/page.tsx`

---

### Phase 2: Formal Notice Generation (Medium Complexity)

**Timeline**: 1 week

**Tasks:**
1. Create PDF generation service (use `@react-pdf/renderer` or `puppeteer`)
2. Build state-specific notice templates
3. Add notice generation UI for landlords
4. Store notices with audit trail

**Files to Create:**
- `src/services/noticeGenerator.ts`
- `src/lib/notices/templates/` (state-specific)
- `src/app/landlord/notices/page.tsx`

---

### Phase 3: Certified Mail Integration (Medium Complexity)

**Timeline**: 1-2 weeks

**Tasks:**
1. Integrate Lob API for certified mail
2. Add delivery tracking webhooks
3. Build notice delivery UI
4. Audit log for all delivery attempts

**Files to Create:**
- `src/services/lob.ts`
- `src/app/api/webhooks/lob/route.ts`
- `src/db/schema/notices.ts`

---

### Phase 4: Process Server Integration (Optional)

**Timeline**: 1 week

**Tasks:**
1. Integrate ABC Legal or similar API
2. Handle proof of service documents
3. Track service attempts

---

## Cost Analysis

### Per-Notice Costs

| Delivery Method | Cost | Speed | Legal Standing |
|-----------------|------|-------|----------------|
| Email only | ~$0 | Instant | Low (no proof) |
| Email + Certified Mail | ~$6 | 2-5 days | High |
| Process Server | $50-150 | 1-3 days | Highest |

### Monthly Cost Estimates (100-unit portfolio)

Assuming 5% late rate (5 tenants/month):

| Scenario | Email | Certified | Process Server | Total |
|----------|-------|-----------|----------------|-------|
| Reminders only | $0 | - | - | $0 |
| + Late notices | $0 | $30 (5 × $6) | - | $30 |
| + Evictions (1/mo) | $0 | $30 | $100 | $130 |

---

## Questions for PM/Stakeholder

1. **Which states do we need to support initially?**
   - State-specific templates are required for legal compliance
   - Start with top 5-10 states?

2. **Should we integrate certified mail from day one?**
   - Or start with email + manual certified mail instructions?

3. **Is process server integration needed?**
   - Higher cost but handles hand-delivery requirement
   - Could be Phase 2 feature

4. **Who generates the notice - system or landlord?**
   - Auto-generate after X days late?
   - Or landlord manually triggers?

5. **What's the approval workflow?**
   - Should landlord review before sending?
   - Or fully automated after threshold?

6. **Budget for third-party services?**
   - Lob: ~$6/certified letter
   - Process servers: ~$100/service

7. **Do we need attorney review for templates?**
   - State-specific legal language is critical
   - May need legal review before production use

---

## Vendor Comparison Summary

| Vendor | Service | API Quality | Pricing | Recommendation |
|--------|---------|-------------|---------|----------------|
| **Lob** | Certified Mail | Excellent | $6-8/letter | **Primary choice** |
| Click2Mail | Certified Mail | Good | $4-7/letter | Budget alternative |
| PostGrid | Certified Mail | Excellent | Similar to Lob | Alternative |
| ABC Legal | Process Server | Good | $50-150/service | If hand-delivery needed |

---

## Next Steps

1. **Immediate**: Implement email reminder automation (low effort, high value)
2. **Short-term**: Build notice PDF generation with state templates
3. **Medium-term**: Integrate Lob for certified mail
4. **Long-term**: Process server integration if needed

---

## References

- [Lob API Documentation](https://docs.lob.com/)
- [Click2Mail API](https://developers.click2mail.com/)
- [PostGrid Documentation](https://docs.postgrid.com/)
- [ABC Legal API](https://www.abclegal.com/api)
- [Nolo - State Eviction Rules](https://www.nolo.com/legal-encyclopedia/state-rules-on-notice-required-to-change-or-terminate-a-month-to-month-tenancy.html)
- [USPS Certified Mail Requirements](https://www.usps.com/ship/insurance-extra-services.htm)
