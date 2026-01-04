# PMS Platform - Project Planning Summary

**Date:** January 3, 2026
**Participants:** Kevin Hale, Claude (AI Development Partner)
**Purpose:** Define product vision, architecture, and roadmap for shareholder alignment

---

## Executive Summary

We are building a **property management system (PMS)** that returns software ownership to users. Inspired by DHH's philosophy at 37signals, our platform offers both self-hosted and SaaS options, ensuring customers are never locked into a vendor relationship.

**Key Differentiators:**
- True ownership via self-hosting option
- Open source core (AGPLv3)
- Plugin architecture for vendor flexibility
- Fair, transparent pricing

---

## Business Model

### Revenue Streams

| Model | Pricing | Target Customer |
|-------|---------|-----------------|
| **Open Source** | Free (AGPLv3) | DIY self-hosters, developers |
| **Self-Hosted License** | One-time $299-$999 | Privacy-conscious landlords/PMs |
| **Hosted SaaS** | $29-$199/month (flat tiers) | Convenience-focused customers |

### SaaS Tier Structure

| Tier | Monthly | Unit Limit |
|------|---------|------------|
| Starter | $29 | Up to 10 units |
| Professional | $79 | Up to 50 units |
| Business | $199 | Up to 200 units |
| Enterprise | Custom | Unlimited |

### Licensing Philosophy

- **Honor system** for open source - no phone-home, no feature lockout
- Premium tiers offer support and advanced features
- Self-hosters can run the software forever with their license version

---

## Target Market

### Primary Users

1. **Small Landlords (1-10 units)**
   - Individual property owners managing their own rentals
   - Value simplicity and low cost
   - May not need property manager

2. **Property Managers (10-100 units)**
   - Professional PMs managing properties for multiple owners
   - Need multi-property dashboards
   - Require payment splitting with landlords

### User Roles

| Role | Description | Key Needs |
|------|-------------|-----------|
| **Renter** | Prospective or current tenant | Browse listings, apply, pay rent, request maintenance |
| **Landlord** | Property owner | Manage properties, review applications, collect rent |
| **Property Manager** | Professional manager | Manage multiple properties, split payments with landlords |

**Key Decision:** Landlords CAN operate independently without a property manager. PMs are optional.

---

## Key Product Decisions

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | SQLite + PostgreSQL (both supported) | SQLite for simple self-hosting, Postgres for scale |
| **Plugin Config** | Admin UI only | No config files - user-friendly for non-technical users |
| **Multi-tenancy** | Multiple orgs per instance | PMs can manage multiple landlords; enables white-label potential |
| **Deployment** | Docker-first | Single container, 5-minute setup for self-hosters |

### Business Logic Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Payment Splitting** | Either party proposes, other confirms | Fair negotiation between landlord and PM |
| **Authentication** | Email/password + social OAuth | Works everywhere, optional OAuth for convenience |
| **Messaging** | Email-first + in-app notifications | Simpler than real-time chat, ensures delivery |
| **Compliance Focus** | US (Fair Housing, FCRA) | Start focused, expand internationally later |

---

## Plugin Architecture

All third-party integrations are abstracted behind interfaces, allowing customers to swap providers without code changes.

### Planned Plugins

| Category | Initial Provider | Future Options |
|----------|------------------|----------------|
| **Payments** | Stripe Connect | Square, PayPal |
| **Background Screening** | TransUnion | Experian, Plaid |
| **Listing Syndication** | Zillow | Apartments.com, Trulia |
| **Maps** | Mapbox | Google Maps, OpenStreetMap |
| **Email** | Resend | SendGrid, SMTP |
| **File Storage** | S3 | Cloudflare R2, MinIO |

### Plugin Interface Example

```typescript
// All payment providers implement this interface
export interface PaymentProvider {
  name: string;
  createConnectedAccount(org: Organization): Promise<string>;
  createPaymentIntent(params: PaymentParams): Promise<PaymentIntent>;
  handleWebhook(payload: unknown, signature: string): Promise<void>;
}
```

**Benefit:** Customers configure providers through Admin UI - no code changes or config files needed.

---

## Payment Flow with Splitting

### How It Works

1. **Agreement Phase**
   - Landlord invites PM to manage property (or vice versa)
   - Proposing party sets split percentage (e.g., 90% landlord / 10% PM)
   - Other party reviews and accepts or counter-proposes
   - Split is locked until both parties agree to change

2. **Payment Phase**
   ```
   Rent Payment ($2,000)
          │
          ▼
   ┌──────────────────┐
   │  Stripe Connect  │
   └────────┬─────────┘
            │
       ┌────┴────┐
       │ Split   │
       │ Engine  │
       └────┬────┘
            │
       ┌────┴────────────────┐
       │                     │
       ▼                     ▼
   Landlord (90%)      PM Company (10%)
     $1,800               $200
   ```

3. **Platform Fee**
   - Separate from PM/landlord split
   - Configurable per pricing tier

---

## Technical Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 16 (App Router) | Full-stack, already in use |
| **Database ORM** | Drizzle | Type-safe, supports SQLite + Postgres |
| **Auth** | NextAuth.js | Flexible, supports OAuth |
| **Payments** | Stripe Connect | Industry standard, supports splits |
| **Styling** | CSS (design system) | No heavy dependencies |
| **Deployment** | Docker + Compose | Simple self-hosting |

---

## Development Roadmap

### Phase 1: Foundation (MVP)
*Estimated: 8-10 weeks*

| Issue | Feature |
|-------|---------|
| #15 | Drizzle ORM with SQLite/Postgres support |
| #16 | Multi-organization tenancy |
| #17 | Property and unit management |
| #18 | Public listing portal |
| #19 | Rental application workflow |
| #20 | Stripe Connect integration |
| #21 | Docker deployment setup |
| #22 | Admin UI for plugin configuration |

**MVP Deliverable:** Landlords can list properties, renters can apply, basic rent collection works, deployable via Docker.

---

### Phase 2: Core PMS Features
*Estimated: 6-8 weeks after Phase 1*

| Issue | Feature |
|-------|---------|
| #23 | Payment splitting for PM/landlord |
| #24 | Lease management |
| #25 | Rent tracking and late fees |
| #26 | Document storage (S3/R2 plugin) |
| #27 | Email notification system |
| #28 | In-app messaging |

**Phase 2 Deliverable:** Full rental lifecycle from application to lease to rent collection with PM support.

---

### Phase 3: Advanced Features
*Estimated: 8-12 weeks after Phase 2*

| Issue | Feature |
|-------|---------|
| #29 | Background screening integration |
| #30 | Maintenance request system |
| #31 | Maintenance scheduling |
| #32 | Listing syndication (Zillow, etc.) |
| #33 | Maps integration |
| #34 | Reporting dashboard |

**Phase 3 Deliverable:** Professional-grade PMS with screening, maintenance, and syndication.

---

### Phase 4: Polish & Scale
*Ongoing after Phase 3*

| Issue | Feature |
|-------|---------|
| #35 | Mobile app / PWA |
| #36 | Public REST API |
| #37 | Webhook system |
| #38 | Audit logging |
| #39 | Fair Housing compliance features |
| #40 | FCRA compliance for screening |

**Phase 4 Deliverable:** Enterprise-ready platform with API, compliance features, and mobile support.

---

## Compliance Considerations

### Fair Housing Act (FHA)
- Standardized screening criteria templates
- Decision documentation requirements
- Listing language scanner
- Audit trail for all decisions

### Fair Credit Reporting Act (FCRA)
- Consent collection before screening
- Adverse action notice workflow
- Dispute handling process
- Required document templates

---

## Competitive Positioning

### What Makes Us Different

| Competitor Problem | Our Solution |
|--------------------|--------------|
| SaaS lock-in, can't leave | Self-host option, data export |
| Per-seat pricing gouging | Flat tier pricing |
| Vendor lock-in for integrations | Plugin architecture, swap anytime |
| Complex setup | Docker one-liner deployment |
| No source access | Open source core (AGPLv3) |

### Target Comparison

| Feature | Buildium | AppFolio | **PMS Platform** |
|---------|----------|----------|------------------|
| Self-host option | No | No | **Yes** |
| Open source | No | No | **Yes (core)** |
| One-time purchase | No | No | **Yes** |
| Plugin flexibility | No | No | **Yes** |
| Small landlord friendly | Limited | No | **Yes** |

---

## Project Status

### Completed
- [x] Initial Next.js scaffold with auth
- [x] Role-based routing (renter/landlord/manager)
- [x] Basic listing CRUD (in-memory)
- [x] UI design system
- [x] Project roadmap documented
- [x] GitHub milestones and issues created

### Current Repository
- **GitHub:** https://github.com/kevinjhale/pms_platform
- **Milestones:** 4 phases with 26 detailed issues
- **License:** AGPLv3 (planned)

---

## Open Questions for Shareholders

1. **Pricing Validation:** Are the proposed tiers competitive for the target market?

2. **Feature Priority:** Should we prioritize any Phase 2/3 features earlier based on market feedback?

3. **Geographic Expansion:** When should we consider international compliance (EU, UK, Canada)?

4. **Mobile Strategy:** PWA first, or invest in native apps earlier?

5. **Partnership Opportunities:** Integration partnerships with screening providers or listing platforms?

---

## Next Steps

1. **Immediate:** Begin Phase 1 development (database + multi-tenancy)
2. **Week 2-3:** Property/unit management + listing portal
3. **Week 4-6:** Application workflow + Stripe integration
4. **Week 7-8:** Docker deployment + admin UI
5. **Week 9-10:** Testing, bug fixes, MVP launch prep

---

## Appendix: GitHub Issue Summary

### Phase 1: Foundation (MVP)
- #15: Drizzle ORM with SQLite/Postgres support
- #16: Multi-organization tenancy
- #17: Property and unit management
- #18: Public listing portal
- #19: Rental application workflow
- #20: Stripe Connect integration
- #21: Docker deployment setup
- #22: Admin UI for plugin configuration

### Phase 2: Core PMS Features
- #23: Payment splitting for PM/landlord
- #24: Lease management
- #25: Rent tracking and late fees
- #26: Document storage
- #27: Email notification system
- #28: In-app messaging

### Phase 3: Advanced Features
- #29: Background screening integration
- #30: Maintenance request system
- #31: Maintenance scheduling
- #32: Listing syndication
- #33: Maps integration
- #34: Reporting dashboard

### Phase 4: Polish & Scale
- #35: Mobile app / PWA
- #36: Public REST API
- #37: Webhook system
- #38: Audit logging
- #39: Fair Housing compliance
- #40: FCRA compliance

---

*Document generated from planning session on January 3, 2026*
