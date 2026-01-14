# Lease Management Research

**Date**: 2026-01-13
**Status**: Research Complete - Awaiting Direction

## Current Pain Point

The current workflow:
1. Create lease document manually (Word/PDF)
2. Send via DocuSign for signatures
3. After signing, **manually re-enter** all lease data into the application:
   - Property/unit details
   - Tenant information
   - Rent amount, security deposit, fees
   - Lease dates, terms, etc.

**Problem**: Double data entry is time-consuming and error-prone.

---

## The Ideal Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    IDEAL LEASE WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │ Application  │  Tenant applies, data collected               │
│  │ Approved     │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Generate     │  System creates lease with all data           │
│  │ Lease in App │  - Pre-filled from application                │
│  │              │  - Landlord reviews/adjusts terms             │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Send for     │  DocuSign/HelloSign via API                   │
│  │ E-Signature  │  - Both parties sign electronically           │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Webhook      │  Signature complete notification              │
│  │ Received     │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Auto-Create  │  No manual entry needed!                      │
│  │ Lease Record │  - Lease active in system                     │
│  │              │  - Payment schedule created                   │
│  │              │  - Signed PDF stored                          │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Approach 1: Generate Lease In-App (Recommended)

### How It Works

1. **Lease data lives in our system first**
   - Created from approved application
   - Landlord configures terms (rent, deposit, fees, dates)
   - All data already in database

2. **Generate PDF from template**
   - Use React PDF or Puppeteer to generate lease document
   - Merge data into template
   - State-specific lease templates

3. **Send to e-signature via API**
   - DocuSign, HelloSign, or PandaDoc API
   - Pre-place signature fields
   - Send to tenant and landlord

4. **Webhook on completion**
   - Receive notification when signed
   - Store signed PDF
   - Activate lease record (already exists)
   - Generate payment schedule

### Benefits

- **Zero manual data entry** - data originates in our system
- **Single source of truth** - no sync issues
- **Immediate activation** - lease active instantly on signature
- **Audit trail** - full history in one place

### Implementation Complexity

| Component | Effort | Notes |
|-----------|--------|-------|
| Lease data model | Done | Already have `leases` table |
| PDF generation | Medium | 3-5 days |
| E-sign integration | Medium | 1 week |
| Webhook handling | Low | 1-2 days |
| Template builder | High | 2-3 weeks (if customizable) |

---

## Approach 2: DocuSign Data Extraction

### If You Must Keep Current DocuSign Workflow

DocuSign can extract data from signed documents via:

#### Option A: DocuSign Form Fields + Webhooks

1. **Set up form fields in DocuSign template**
   - Text fields for rent, deposit, dates, etc.
   - These become extractable data

2. **Webhook on envelope completion**
   - DocuSign sends POST with all form field values
   - Parse and create lease record

**Limitation**: Requires restructuring DocuSign templates with named fields.

#### Option B: DocuSign Connect

- Real-time data sync
- Push envelope data to your endpoint
- More complex setup

### DocuSign API Integration

```javascript
// Example: Create envelope with data extraction
const envelope = {
  emailSubject: 'Please sign your lease agreement',
  documents: [{ documentBase64: leaseBase64, name: 'Lease.pdf' }],
  recipients: {
    signers: [{
      email: tenant.email,
      name: tenant.name,
      tabs: {
        textTabs: [
          { tabLabel: 'rent_amount', value: '$2,500' },
          { tabLabel: 'security_deposit', value: '$2,500' },
          { tabLabel: 'lease_start', value: '2026-02-01' },
        ],
        signHereTabs: [{ documentId: '1', pageNumber: '10', xPosition: '100', yPosition: '700' }]
      }
    }]
  }
};

// On completion webhook, extract these values back
```

### Pros/Cons

| Pros | Cons |
|------|------|
| Keep existing DocuSign workflow | Requires template restructuring |
| Familiar to users | Form fields can be limiting |
| DocuSign handles compliance | Still some manual setup per lease |

---

## Approach 3: AI Document Parsing (For Existing Leases)

### Use Case

- Import historical leases
- Handle leases created outside the system
- One-time migration

### Services

#### 1. Docsumo

**Website**: https://www.docsumo.com

- AI-powered document extraction
- Trained for lease/contract parsing
- API available
- ~$0.10-0.50 per document

#### 2. Amazon Textract

**Website**: https://aws.amazon.com/textract/

- OCR + form extraction
- Custom queries for specific fields
- ~$0.01-0.05 per page

#### 3. Google Document AI

**Website**: https://cloud.google.com/document-ai

- Pre-trained contract parser
- Custom model training
- ~$0.01-0.10 per page

#### 4. OpenAI GPT-4 Vision

- Upload lease PDF/image
- Extract structured data via prompt
- ~$0.01-0.03 per page
- Most flexible, less structured

### Example: GPT-4 Extraction

```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-4-vision-preview',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: `Extract the following from this lease:
        - Tenant name(s)
        - Property address
        - Monthly rent
        - Security deposit
        - Lease start date
        - Lease end date
        - Pet policy
        - Late fee amount
        Return as JSON.` },
      { type: 'image_url', image_url: { url: leaseImageUrl } }
    ]
  }]
});
```

### Pros/Cons

| Pros | Cons |
|------|------|
| Works with any document | Not 100% accurate |
| Good for migration | Requires review/validation |
| Handles legacy leases | Cost per document |

---

## E-Signature Platform Comparison

### DocuSign

**Current choice**

| Feature | Details |
|---------|---------|
| API | Excellent, well-documented |
| Pricing | $25-65/user/month |
| Compliance | Industry standard, legally binding |
| Webhooks | Yes, DocuSign Connect |
| Templates | Yes, with form fields |

### HelloSign (Dropbox Sign)

**Strong alternative**

| Feature | Details |
|---------|---------|
| API | Excellent, developer-friendly |
| Pricing | $20-35/user/month, API plan available |
| Compliance | Legally binding, ESIGN/UETA |
| Webhooks | Yes |
| Templates | Yes |
| Advantage | Often cheaper, simpler API |

### PandaDoc

**Document + E-sign combined**

| Feature | Details |
|---------|---------|
| API | Good |
| Pricing | $35-65/user/month |
| Compliance | Legally binding |
| Advantage | Built-in document builder |
| Best for | Teams wanting drag-drop template creation |

### SignWell

**Budget option**

| Feature | Details |
|---------|---------|
| API | Basic but functional |
| Pricing | $10-24/user/month |
| Compliance | Legally binding |
| Best for | Cost-conscious users |

### BoldSign (Syncfusion)

**Developer-focused**

| Feature | Details |
|---------|---------|
| API | Excellent |
| Pricing | $99/month flat (unlimited users) |
| Compliance | Legally binding |
| Best for | High volume, dev teams |

---

## Recommended Architecture

### Lease Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEASE MANAGEMENT SYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    LEASE BUILDER                         │    │
│  │                                                          │    │
│  │  Property: [Sunset Apartments - Unit 201    ▼]          │    │
│  │  Tenant:   [From approved application       ▼]          │    │
│  │                                                          │    │
│  │  ─────────────────────────────────────────────          │    │
│  │  Monthly Rent:     [$2,500.00        ]                  │    │
│  │  Security Deposit: [$2,500.00        ]                  │    │
│  │  Pet Deposit:      [$500.00          ]                  │    │
│  │  ─────────────────────────────────────────────          │    │
│  │  Lease Start:      [02/01/2026]                         │    │
│  │  Lease End:        [01/31/2027]                         │    │
│  │  ─────────────────────────────────────────────          │    │
│  │  Template:         [California Standard Lease ▼]        │    │
│  │  ─────────────────────────────────────────────          │    │
│  │                                                          │    │
│  │  [Preview PDF]  [Save Draft]  [Send for Signature]      │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    E-SIGNATURE                           │    │
│  │                                                          │    │
│  │  Status: Awaiting Tenant Signature                       │    │
│  │  Sent: Jan 13, 2026 at 2:30 PM                          │    │
│  │  Tenant viewed: Jan 13, 2026 at 3:15 PM                 │    │
│  │                                                          │    │
│  │  [Resend]  [Cancel]  [View Document]                    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    ACTIVE LEASE                          │    │
│  │                                                          │    │
│  │  ✓ Lease signed by all parties                          │    │
│  │  ✓ Payment schedule created (12 payments)               │    │
│  │  ✓ Move-in charges generated                            │    │
│  │  ✓ Signed PDF stored                                    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema Additions

```sql
-- Lease templates (state-specific)
CREATE TABLE lease_templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,           -- "California Standard Lease"
  state TEXT,                   -- "CA"
  content TEXT NOT NULL,        -- HTML/Markdown template with variables
  variables JSONB,              -- [{name: "rent", type: "currency"}, ...]
  is_default BOOLEAN DEFAULT false,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Lease documents (generated PDFs and signatures)
CREATE TABLE lease_documents (
  id TEXT PRIMARY KEY,
  lease_id TEXT REFERENCES leases(id),
  type TEXT NOT NULL,           -- 'draft', 'sent', 'signed'
  file_url TEXT,                -- Stored PDF
  esign_envelope_id TEXT,       -- DocuSign/HelloSign envelope ID
  esign_status TEXT,            -- 'pending', 'viewed', 'signed', 'declined'
  sent_at INTEGER,
  signed_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Signature tracking
CREATE TABLE lease_signatures (
  id TEXT PRIMARY KEY,
  lease_document_id TEXT REFERENCES lease_documents(id),
  signer_type TEXT NOT NULL,    -- 'tenant', 'landlord', 'guarantor'
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  status TEXT NOT NULL,         -- 'pending', 'signed', 'declined'
  signed_at INTEGER,
  ip_address TEXT,
  created_at INTEGER NOT NULL
);
```

---

## Implementation Phases

### Phase 1: Lease Builder UI (1 week)

**Goal**: Create leases in-app with all data

**Tasks:**
1. Lease creation form with all fields
2. Pre-fill from approved application
3. Save as draft
4. Generate preview PDF

**Files to Create:**
- `src/app/landlord/leases/new/page.tsx` (enhanced)
- `src/services/leaseGenerator.ts`
- `src/lib/pdf/leaseTemplate.tsx`

---

### Phase 2: E-Signature Integration (1-2 weeks)

**Goal**: Send for signature, receive webhooks

**Tasks:**
1. Integrate HelloSign or DocuSign API
2. Send envelope with pre-placed signatures
3. Webhook endpoint for status updates
4. Store signed PDF

**Files to Create:**
- `src/services/esign.ts` (HelloSign/DocuSign client)
- `src/app/api/webhooks/esign/route.ts`
- `src/db/schema/leaseDocuments.ts`

---

### Phase 3: Auto-Activation (3-5 days)

**Goal**: Zero manual entry on signature

**Tasks:**
1. On signature complete, activate lease
2. Generate payment schedule
3. Create move-in charges
4. Send welcome email to tenant

---

### Phase 4: Template Builder (Optional, 2-3 weeks)

**Goal**: Landlords customize lease templates

**Tasks:**
1. WYSIWYG template editor
2. Variable insertion ({{rent}}, {{tenant_name}})
3. State-specific clause library
4. Template versioning

---

## Cost Comparison

### E-Signature Costs (per envelope/lease)

| Platform | Monthly Fee | Per Envelope | 50 leases/month |
|----------|-------------|--------------|-----------------|
| DocuSign Business | $65/user | Included (100/mo) | $65 |
| HelloSign Standard | $25/user | Included (unlimited) | $25 |
| PandaDoc Business | $65/user | Included | $65 |
| BoldSign | $99 flat | Unlimited | $99 |
| SignWell | $24/user | Included | $24 |

### Recommendation by Volume

| Leases/Month | Recommendation | Monthly Cost |
|--------------|----------------|--------------|
| 1-10 | HelloSign Standard | $25 |
| 10-50 | HelloSign or BoldSign | $25-99 |
| 50-200 | BoldSign (unlimited) | $99 |
| 200+ | DocuSign API pricing | Custom |

---

## Questions for PM/Stakeholder

1. **Keep DocuSign or switch?**
   - HelloSign is cheaper and has excellent API
   - DocuSign is more recognized but pricier
   - BoldSign is best for high volume

2. **Do landlords need custom templates?**
   - Phase 4 template builder is significant effort
   - Could start with pre-built state templates

3. **What states to support first?**
   - Each state has different lease requirements
   - Start with CA, TX, FL, NY, IL?

4. **How to handle existing leases?**
   - Manual entry for legacy data?
   - AI parsing for migration?
   - Grandfather with limited data?

5. **Who signs first - tenant or landlord?**
   - Sequential (tenant → landlord)?
   - Parallel (both at once)?

6. **Do guarantors/co-signers need to sign?**
   - Adds complexity to signature flow
   - May need separate signature request

7. **Move-in payment collection?**
   - Collect first month + deposit via Stripe after signature?
   - Or handle separately?

8. **Lease renewal automation?**
   - Auto-generate renewal offers?
   - Same flow as new lease?

---

## Quick Win: Minimal Integration

If you want to keep DocuSign but reduce manual entry:

### Step 1: Export lease data, send via API

```javascript
// In your app, when creating lease
const leaseData = {
  tenant: 'John Smith',
  rent: 2500,
  deposit: 2500,
  startDate: '2026-02-01',
  endDate: '2027-01-31',
};

// Save to DB first
const lease = await createLease(leaseData);

// Then send to DocuSign
await docusign.sendEnvelope({
  templateId: 'your-template-id',
  signers: [{ email: tenant.email, name: tenant.name }],
  customFields: leaseData, // Pre-fill fields
});
```

### Step 2: Webhook activates lease

```javascript
// POST /api/webhooks/docusign
if (event.status === 'completed') {
  await activateLease(event.envelopeId);
  await createPaymentSchedule(leaseId);
  await storeSignedDocument(event.documentUrl);
}
```

**Result**: Data entered once, lease activates automatically on signature.

---

## Summary

| Approach | Effort | Data Entry | Best For |
|----------|--------|------------|----------|
| **Generate in-app** | Medium | Zero | New implementation |
| **DocuSign extraction** | Low | Minimal | Keep existing workflow |
| **AI parsing** | Medium | Review needed | Historical leases |

**Recommendation**: Build lease creation in-app, integrate HelloSign/DocuSign for signatures, auto-activate on completion. This eliminates duplicate data entry entirely.

---

## References

- [DocuSign eSignature API](https://developers.docusign.com/docs/esign-rest-api/)
- [HelloSign API](https://developers.hellosign.com/)
- [PandaDoc API](https://developers.pandadoc.com/)
- [BoldSign API](https://www.boldsign.com/api/)
- [React PDF](https://react-pdf.org/)
- [Puppeteer PDF Generation](https://pptr.dev/)
