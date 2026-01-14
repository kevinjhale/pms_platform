# Payment Processing Research

**Date**: 2026-01-13
**Status**: Awaiting PM Direction

## Context

A potential client expressed concerns about rent payment collection. His current setup:
- Accepts payments via Zelle, CashApp, Venmo, PayPal, and QuickBooks
- Most renters want "one-click" payment
- QuickBooks charges the landlord the processing fee (not the renter)
- **Payment splitting (PM/landlord revenue split) is non-negotiable**

## Current Payment Landscape Analysis

### The Problem with P2P Apps (Zelle, Venmo, CashApp)

These are **consumer P2P apps**, not merchant payment solutions:
- **No APIs for receiving payments** - Designed for person-to-person, not business automation
- **No payment splitting** - Money goes directly to recipient
- **No webhook notifications** - Can't automatically mark rent as paid
- **Manual reconciliation** - Landlord must manually verify and record

### Why Landlords Use Them Anyway
- Zero fees (or very low)
- Renters already have accounts
- Instant transfers
- "One-click" familiarity

---

## Options Explored

### Option 1: Stripe Connect with ACH (Recommended for Automated Splitting)

**How it works:**
- Landlords/PMs onboard as Stripe Connected Accounts
- Renters pay via ACH (bank transfer) or card
- Stripe automatically splits payments per configured percentages
- Fees can be passed to the renter

**Pros:**
- Automated splitting (non-negotiable requirement met)
- ACH fees are low (~0.8%, capped at $5)
- Full automation - webhooks, receipts, reconciliation
- Handles tax reporting (1099s)
- Already partially built in our system

**Cons:**
- Renters need to enter bank info (friction)
- 3-5 day ACH settlement
- Some renters prefer their existing apps

**Fee Structure:**

| Method | Fee | Who Pays (Configurable) |
|--------|-----|------------------------|
| ACH | 0.8% (max $5) | Renter or Landlord |
| Card | 2.9% + $0.30 | Renter or Landlord |

---

### Option 2: Hybrid Model - "Record Any Payment"

**How it works:**
- Keep Stripe for automated payments
- Add a "Record External Payment" feature
- Landlord receives money via Zelle/Venmo/etc. externally
- Landlord logs it in the system with source, amount, date
- System calculates PM split and tracks what's owed

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                    RENTER PAYS                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │
│  │   Stripe    │   │   Zelle     │   │   Venmo     │   │
│  │  (in-app)   │   │  (external) │   │  (external) │   │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   │
│         │                 │                 │          │
│         ▼                 ▼                 ▼          │
│   ┌──────────┐      ┌──────────────────────────┐       │
│   │ Webhook  │      │  Landlord Records in App │       │
│   │ Auto-log │      │  (amount, source, date)  │       │
│   └────┬─────┘      └────────────┬─────────────┘       │
│        │                         │                     │
│        └────────────┬────────────┘                     │
│                     ▼                                  │
│         ┌─────────────────────┐                        │
│         │  Payment Recorded   │                        │
│         │  Split Calculated   │                        │
│         │  PM Owes $X to LL   │                        │
│         └─────────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

**Pros:**
- Landlords keep using what works
- Zero friction for renters
- Still tracks splits and balances
- No forced migration

**Cons:**
- Manual entry by landlord
- No automated verification
- Trust-based (PM records payment, calculates split)

---

### Option 3: PayPal Commerce Platform

**How it works:**
- PayPal has a marketplace API with payment splitting
- Renters can pay via PayPal balance, cards, or **Venmo** (PayPal owns it)
- Automatic splits to multiple recipients

**Pros:**
- Venmo integration (big win for renter UX)
- PayPal brand trust
- Automatic splitting
- Lower fees than Stripe for PayPal balance payments

**Cons:**
- Complex onboarding for landlords
- Not as developer-friendly as Stripe
- Settlement delays

---

### Option 4: Plaid + Dwolla/Moov (Low-Cost ACH)

**How it works:**
- Plaid for bank account linking (renter connects bank once)
- Dwolla or Moov for ACH transfers
- Fees as low as $0.25 per transaction

**Pros:**
- Very low fees
- "One-click" after initial setup
- Can implement splitting

**Cons:**
- Two vendors to integrate
- More complex compliance
- ACH settlement delays

---

## Recommended Approach: Hybrid Payment System

Build a **flexible payment system** with three tiers:

### Tier 1: Automated (Stripe Connect)
- Full automation with ACH and cards
- Automatic splitting
- Best for landlords who want hands-off

### Tier 2: Semi-Automated (PayPal/Venmo)
- Integration with PayPal Commerce
- Covers Venmo users
- Automatic splitting via PayPal

### Tier 3: Manual Recording (Zelle, CashApp, Checks)
- "Record External Payment" feature
- Landlord logs: amount, source, date, reference
- System calculates splits and tracks balances
- PM Settlement Report shows what PM owes landlord

### Configuration UI Concept

```
Payment Methods Accepted
─────────────────────────────────────────
☑ Stripe (ACH & Cards)     [Configure →]
☑ PayPal / Venmo           [Configure →]
☑ Zelle (manual recording)
☑ CashApp (manual recording)
☐ QuickBooks Payments      [Configure →]

Fee Handling
─────────────────────────────────────────
◉ Pass processing fees to renter
○ Landlord absorbs fees
○ Split fees with PM
```

---

## Questions for PM/Stakeholder

1. **How important is full automation vs. flexibility?**
   - If landlords are okay recording Zelle payments manually, the hybrid approach works great
   - Full automation requires renters to use supported payment methods

2. **What's the typical rent amount?**
   - ACH caps at $5 fee, so for $2000+ rent, ACH is very cost-effective
   - Cards become expensive at higher amounts (2.9% of $3000 = $87)

3. **Is QuickBooks integration important?**
   - QuickBooks has payment APIs - could integrate for landlords already using it
   - Would allow keeping existing QuickBooks workflow

4. **Would landlords pay for convenience?**
   - A small monthly fee for full automation might be acceptable
   - Or per-transaction fee passed to renter

5. **What percentage of renters use each payment method?**
   - Helps prioritize which integrations to build first
   - If 80% use Zelle, manual recording might be sufficient

6. **Is real-time payment verification required?**
   - Automated systems verify instantly
   - Manual recording relies on landlord honesty
   - Could add bank statement import for verification

7. **How should disputes be handled?**
   - Renter claims they paid via Zelle, landlord says they didn't
   - Need clear audit trail and dispute resolution process

---

## Implementation Complexity Estimates

| Option | Complexity | Time to Build | Ongoing Maintenance |
|--------|------------|---------------|---------------------|
| Stripe Connect (existing) | Low | Already built | Low |
| Manual Payment Recording | Low | 1-2 days | Low |
| PayPal Commerce | Medium | 1-2 weeks | Medium |
| Plaid + Dwolla | High | 2-4 weeks | High |
| QuickBooks Integration | Medium | 1 week | Medium |

---

## Next Steps

Once PM provides direction on the questions above, we can:

1. **If prioritizing flexibility**: Build manual payment recording first
2. **If prioritizing automation**: Enhance Stripe Connect with ACH promotion
3. **If Venmo is critical**: Integrate PayPal Commerce Platform
4. **If cost is critical**: Explore Plaid + Dwolla for lowest fees

---

## References

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [PayPal Commerce Platform](https://developer.paypal.com/docs/commerce-platform/)
- [Dwolla ACH API](https://developers.dwolla.com/)
- [Plaid Link](https://plaid.com/docs/link/)
- [QuickBooks Payments API](https://developer.intuit.com/app/developer/qbpayments/docs/get-started)
