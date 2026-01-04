# PMS Platform Roadmap

## Vision

A property management system that returns ownership to users. Inspired by DHH's philosophy - software you can own, run yourself, and isn't held hostage by a SaaS vendor.

**Business Model:**
- **Open Source Core** (AGPLv3) - honor system, community-driven
- **Self-Hosted License** - one-time purchase, run on your infrastructure
- **Hosted SaaS** - flat-tier pricing for those who prefer managed hosting

---

## Architecture Principles

### 1. Plugin-Based Integrations

All third-party services are abstracted behind interfaces. Swap Stripe for Square, TransUnion for Experian, without code changes.

```
src/
  plugins/
    payments/
      interface.ts        # PaymentProvider interface
      stripe/             # Stripe implementation
      square/             # Square implementation (future)
    screening/
      interface.ts        # ScreeningProvider interface
      transunion/
    listings-sync/
      interface.ts        # ListingSyncProvider interface
      zillow/
    maps/
      interface.ts        # MapsProvider interface
      mapbox/
      google/
```

**Configuration:** Admin UI only - no config files required. Self-hosters configure via web interface.

### 2. Database Flexibility

Support both databases from day one:

| Use Case | Database | Why |
|----------|----------|-----|
| Small landlord (1-20 units) | SQLite | Zero config, single file backup |
| Property manager (20+ units) | PostgreSQL | Concurrent access, scalability |

**Implementation:** Use Drizzle ORM with dialect abstraction. Schema stays identical, driver swaps.

### 3. Multi-Tenancy

Multiple organizations can share one instance:

```
Organizations (PM companies, independent landlords)
  └── Users (with roles: admin, manager, staff)
       └── Properties
            └── Units
                 └── Leases
                      └── Tenants
```

Each organization is fully isolated. Users can belong to multiple orgs (e.g., a landlord using two different PMs).

### 4. Docker-First Deployment

```yaml
# docker-compose.yml for self-hosters
services:
  pms:
    image: pms-platform:latest
    environment:
      - DATABASE_URL=file:./data/pms.db  # SQLite
      - AUTH_SECRET=...
    volumes:
      - ./data:/app/data
    ports:
      - "3000:3000"
```

Single container, single command: `docker-compose up`

---

## User Roles & Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    ORGANIZATION                          │
│  (PM Company or Independent Landlord)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   LANDLORD ──────────────────┐                          │
│   (property owner)            │                          │
│         │                     │ optional                 │
│         │ owns                │ management               │
│         ▼                     │ agreement                │
│   PROPERTY ◄──────────────────┘                          │
│         │                     │                          │
│         │ contains            │ managed by               │
│         ▼                     ▼                          │
│      UNIT              PROPERTY MANAGER                  │
│         │              (if applicable)                   │
│         │ leased to                                      │
│         ▼                                                │
│     RENTER                                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key:** Landlords CAN operate without a PM. When a PM is involved, payment splits apply.

---

## Payment Flow with Splitting

### Configuration (Either Party Proposes)

1. Landlord invites PM to manage property, proposes 90/10 split
2. PM reviews and accepts (or counter-proposes)
3. Split is locked until both parties agree to change

### Payment Distribution

```
Rent Payment ($2,000)
       │
       ▼
┌──────────────────┐
│  Stripe Connect  │
│  (Platform)      │
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

**Implementation:** Stripe Connect with destination charges. Platform fee (our cut) is separate from PM split.

---

## Feature Roadmap

### Phase 1: Foundation (MVP)
*Target: 8-10 weeks*

- [x] **Database layer** - Drizzle with SQLite/Postgres support
- [x] **Multi-org tenancy** - Organization, User, Role models
- [x] **Property management** - CRUD for properties, units
- [x] **Listing portal** - Public listing pages, renter browsing
- [x] **Application workflow** - Submit, review, approve/reject
- [ ] **Basic payments** - Stripe Connect integration, no splitting yet
- [x] **Docker deployment** - Single container, compose file
- [ ] **Admin UI** - Plugin configuration interface

### Phase 2: Core PMS Features
*Target: 6-8 weeks after Phase 1*

- [ ] **Payment splitting** - PM/Landlord split configuration and distribution
- [x] **Lease management** - Lease terms, renewals, move-in/move-out
- [x] **Rent tracking** - Due dates, late fees, payment history
- [ ] **Document storage** - Leases, IDs, pay stubs (S3/R2 plugin)
- [ ] **Email notifications** - Transactional emails (Resend/SendGrid plugin)
- [ ] **In-app messaging** - Threaded conversations with email fallback

### Phase 3: Advanced Features
*Target: 8-12 weeks after Phase 2*

- [ ] **Background screening** - TransUnion/Experian plugin
- [x] **Maintenance requests** - Tenant submissions, vendor assignment
- [ ] **Maintenance scheduling** - Calendar, recurring tasks
- [ ] **Listing syndication** - Zillow, Apartments.com sync
- [ ] **Maps integration** - Property location display (Mapbox/Google)
- [x] **Reporting** - Income, expenses, vacancy rates

### Phase 4: Polish & Scale
*Ongoing*

- [ ] **Mobile app** - React Native or PWA
- [ ] **API** - Public REST API for integrations
- [ ] **Webhooks** - Event notifications for external systems
- [x] **Audit logging** - Compliance trail for all actions
- [ ] **Fair Housing compliance** - Screening criteria guardrails
- [ ] **FCRA compliance** - Adverse action notices, dispute handling

---

## Technical Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 16 (App Router) | Already in use, full-stack capable |
| Database | Drizzle + SQLite/Postgres | Type-safe, dialect-agnostic |
| Auth | NextAuth.js | Already in use, supports OAuth |
| Payments | Stripe Connect | Industry standard, supports splits |
| Email | Resend (plugin) | Simple API, good DX |
| File Storage | S3/R2 (plugin) | Standard, self-hostable with MinIO |
| Search | SQLite FTS / Postgres full-text | No external dependency |
| Jobs | BullMQ + Redis OR SQLite-based | Background processing |
| Container | Docker + Compose | Simple self-hosting |

---

## Plugin Interface Example

```typescript
// src/plugins/payments/interface.ts
export interface PaymentProvider {
  name: string;

  // Setup
  createConnectedAccount(org: Organization): Promise<string>;
  getOnboardingUrl(accountId: string): Promise<string>;

  // Payments
  createPaymentIntent(params: {
    amount: number;
    currency: string;
    splits: PaymentSplit[];
  }): Promise<PaymentIntent>;

  // Webhooks
  handleWebhook(payload: unknown, signature: string): Promise<void>;
}

export interface PaymentSplit {
  accountId: string;
  amount: number;  // in cents
}
```

```typescript
// src/plugins/payments/stripe/index.ts
export class StripeProvider implements PaymentProvider {
  name = 'stripe';

  async createPaymentIntent(params) {
    // Stripe-specific implementation
  }
}
```

**Admin UI:** Dropdown to select active provider, form fields for API keys (encrypted at rest).

---

## Compliance Considerations

### Fair Housing Act
- No discriminatory screening criteria
- Consistent application of rules
- Document all decisions

### FCRA (Background Checks)
- Permissible purpose verification
- Adverse action notices
- Dispute resolution process
- Data retention limits

### Implementation
- Built-in templates for required notices
- Audit log for all screening decisions
- Configurable criteria with guardrails

---

## Monetization

### Self-Hosted (One-Time)
| Tier | Price | Includes |
|------|-------|----------|
| Starter | Free (AGPL) | Core features, community support |
| Professional | $299 | Priority support, premium plugins |
| Enterprise | $999 | SSO, audit logs, dedicated support |

### Hosted SaaS (Monthly)
| Tier | Price | Units |
|------|-------|-------|
| Starter | $29/mo | Up to 10 units |
| Professional | $79/mo | Up to 50 units |
| Business | $199/mo | Up to 200 units |
| Enterprise | Custom | Unlimited |

---

## What Makes This Great

1. **True Ownership** - Self-host with no phone-home, no feature lockout
2. **Escape Hatch** - Export all data, switch providers anytime
3. **Fair Pricing** - One-time purchase option, no per-seat gouging
4. **Plugin Flexibility** - Use your preferred vendors
5. **Compliance Built-In** - Fair Housing and FCRA guardrails
6. **Simple Deployment** - Single Docker container, 5-minute setup

---

## Next Steps

1. Finalize database schema design
2. Implement plugin architecture skeleton
3. Build multi-org tenancy layer
4. Create Docker deployment setup
5. Implement Stripe Connect integration
6. Build core property/unit/lease models

---

*This roadmap is a living document. Updated as priorities evolve.*
