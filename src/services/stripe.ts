import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null;

export function isStripeConfigured(): boolean {
  return !!stripe && !!process.env.STRIPE_PUBLISHABLE_KEY;
}

export interface CreateCheckoutParams {
  paymentId: string;
  userId: string;
  amount: number; // in cents
  propertyName: string;
  periodLabel: string; // e.g., "January 2026"
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string | null> {
  if (!stripe) {
    console.warn('[Stripe] Not configured - skipping checkout session creation');
    return null;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Rent Payment - ${params.propertyName}`,
              description: `Rent for ${params.periodLabel}`,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        paymentId: params.paymentId,
        userId: params.userId,
      },
      client_reference_id: params.paymentId,
    });

    return session.url;
  } catch (error) {
    console.error('[Stripe] Failed to create checkout session:', error);
    return null;
  }
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event | null> {
  if (!stripe) return null;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('[Stripe] Webhook secret not configured');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error);
    return null;
  }
}
