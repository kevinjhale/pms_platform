# Stripe Payment Configuration

This guide explains how to configure Stripe for online rent payments in PMS Platform.

## Overview

PMS Platform integrates with Stripe Checkout to process rent payments. Tenants can pay their rent online with credit/debit cards.

## Prerequisites

- A Stripe account ([stripe.com](https://stripe.com))
- For production: A verified Stripe account with business details

## Setup Steps

### 1. Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete the account verification process (for production payments)

### 2. Get Your API Keys

1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle between **Test mode** and **Live mode** in the left sidebar
3. Go to **Developers > API keys**
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Test mode (for development)
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"

# Live mode (for production)
# STRIPE_SECRET_KEY="sk_live_xxxxxxxxxxxxxxxxxxxx"
# STRIPE_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxxxxxxxxx"
# STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"
```

### 4. Set Up Webhooks

Webhooks notify PMS Platform when a payment is completed.

#### For Local Development (Using Stripe CLI)

1. **Install the Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (via scoop)
   scoop install stripe

   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

4. **Copy the webhook secret** displayed (starts with `whsec_`) and add it to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"
   ```

5. **Keep the CLI running** while testing payments

#### For Production

1. Go to **Developers > Webhooks** in the Stripe Dashboard
2. Click **Add endpoint**
3. Enter your endpoint URL:
   ```
   https://your-domain.com/api/payments/webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
5. Click **Add endpoint**
6. Copy the **Signing secret** and add to your production `.env`

## Testing Payments

### Test Card Numbers

Use these test card numbers in Stripe's test mode:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure authentication required |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0000 0000 0077` | Successful charge, dispute later |

Use any future expiration date and any 3-digit CVC.

### Testing the Flow

1. **Start the development server**:
   ```bash
   bun run dev
   ```

2. **Start the Stripe CLI webhook forwarder** (in another terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

3. **Log in as a renter** (e.g., `alice.johnson@demo.com`)

4. **Navigate to Payments** in the renter dashboard

5. **Click "Pay Now"** on an outstanding payment

6. **Complete the checkout** with a test card

7. **Verify the payment** is marked as paid in the system

## How It Works

### Payment Flow

1. Tenant clicks "Pay Now" on a rent payment
2. PMS Platform creates a Stripe Checkout Session
3. Tenant is redirected to Stripe's hosted payment page
4. Tenant enters payment details and submits
5. Stripe processes the payment
6. Stripe sends a webhook to `/api/payments/webhook`
7. PMS Platform updates the payment status to "paid"
8. Tenant is redirected back to the payments page

### Code Structure

| File | Purpose |
|------|---------|
| `src/services/stripe.ts` | Stripe SDK wrapper, session creation |
| `src/app/api/payments/checkout/route.ts` | Creates checkout sessions |
| `src/app/api/payments/webhook/route.ts` | Handles payment completion webhooks |
| `src/components/PayButton.tsx` | Payment button component |

## Security Considerations

### Webhook Signature Verification

All incoming webhooks are verified using the webhook secret:

```typescript
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

Never process webhook events without verification.

### API Key Security

- Never expose your **Secret key** (`sk_`) in client-side code
- The **Publishable key** (`pk_`) is safe to use in client-side code
- In production, store keys securely (environment variables, secrets manager)
- Rotate keys immediately if compromised

### PCI Compliance

Using Stripe Checkout means:
- Card data never touches your servers
- Stripe handles PCI compliance
- Your PCI burden is minimal (SAQ A)

## Troubleshooting

### "Stripe not configured"

The Pay button won't appear if Stripe keys aren't set. Check:
- Both `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set
- Keys are valid (test keys for development, live keys for production)
- The server was restarted after adding keys

### Webhook not receiving events

1. Check the Stripe CLI is running (for local dev)
2. Verify the webhook endpoint URL is correct
3. Check webhook logs in Stripe Dashboard > Developers > Webhooks
4. Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret

### Payment marked as paid but webhook failed

Check the webhook logs for errors. Common issues:
- Invalid webhook secret
- Server error processing the webhook
- Database connection issues

### "Invalid API key"

- Verify you're using the correct keys for your mode (test vs live)
- Check for extra whitespace in your `.env` file
- Regenerate keys in the Stripe Dashboard if needed

## Going Live

Before accepting real payments:

1. **Complete Stripe account verification**
   - Add business details
   - Verify identity
   - Add bank account for payouts

2. **Switch to live API keys**
   - Get live keys from Stripe Dashboard (not in test mode)
   - Update your production `.env`

3. **Create a production webhook**
   - Add your production URL in Stripe Dashboard
   - Update `STRIPE_WEBHOOK_SECRET` with the live webhook secret

4. **Test with a real card**
   - Make a small real payment to verify everything works
   - Refund the payment afterward

5. **Monitor transactions**
   - Set up email notifications in Stripe
   - Review the Dashboard regularly
   - Set up alerts for failed payments

## Advanced Features (Future)

PMS Platform's Stripe integration can be extended for:

- **Stripe Connect**: Split payments between property managers and landlords
- **Automated payouts**: Configure payout schedules
- **Recurring payments**: Set up autopay for tenants
- **Late fees**: Automatically add late fees to overdue payments
- **Payment plans**: Allow partial payments
