import Stripe from 'stripe';
import { getStripeSettingsWithFallback, hasIntegrationSettings } from './integrationSettings';

// Cache for Stripe instances per organization
const stripeCache = new Map<string, Stripe>();

// Global instance for backward compatibility (uses env vars)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null;

/**
 * Check if Stripe is configured globally (for backward compatibility)
 */
export function isStripeConfigured(): boolean {
  return !!stripe && !!process.env.STRIPE_PUBLISHABLE_KEY;
}

/**
 * Get Stripe instance for a specific organization
 * Falls back to environment variables if org has no custom settings
 */
export async function getStripeForOrg(orgId: string): Promise<Stripe | null> {
  // Check cache first
  if (stripeCache.has(orgId)) {
    return stripeCache.get(orgId)!;
  }

  const settings = await getStripeSettingsWithFallback(orgId);

  if (!settings.secretKey) {
    return null;
  }

  const stripeInstance = new Stripe(settings.secretKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });

  stripeCache.set(orgId, stripeInstance);
  return stripeInstance;
}

/**
 * Get Stripe publishable key for an organization
 */
export async function getStripePublishableKey(orgId: string): Promise<string | null> {
  const settings = await getStripeSettingsWithFallback(orgId);
  return settings.publishableKey || null;
}

/**
 * Get Stripe webhook secret for an organization
 */
export async function getStripeWebhookSecret(orgId: string): Promise<string | null> {
  const settings = await getStripeSettingsWithFallback(orgId);
  return settings.webhookSecret || null;
}

/**
 * Check if Stripe is configured for a specific organization
 */
export async function isStripeConfiguredForOrg(orgId: string): Promise<boolean> {
  const stripeInstance = await getStripeForOrg(orgId);
  const pubKey = await getStripePublishableKey(orgId);
  return !!stripeInstance && !!pubKey;
}

/**
 * Check if organization has custom Stripe settings (vs using env defaults)
 */
export async function hasCustomStripeSettings(orgId: string): Promise<boolean> {
  return hasIntegrationSettings(orgId, 'stripe');
}

/**
 * Clear cached Stripe instance for an organization (call when settings change)
 */
export function clearStripeCache(orgId: string): void {
  stripeCache.delete(orgId);
}

/**
 * Clear all cached Stripe instances
 */
export function clearAllStripeCache(): void {
  stripeCache.clear();
}

export interface CreateCheckoutParams {
  paymentId: string;
  userId: string;
  amount: number; // in cents
  propertyName: string;
  periodLabel: string; // e.g., "January 2026"
  successUrl: string;
  cancelUrl: string;
  organizationId?: string; // Optional for backward compatibility
}

/**
 * Create a Stripe checkout session
 * Uses org-specific settings if organizationId is provided
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string | null> {
  const stripeInstance = params.organizationId
    ? await getStripeForOrg(params.organizationId)
    : stripe;

  if (!stripeInstance) {
    console.warn('[Stripe] Not configured - skipping checkout session creation');
    return null;
  }

  try {
    const session = await stripeInstance.checkout.sessions.create({
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
        organizationId: params.organizationId || '',
      },
      client_reference_id: params.paymentId,
    });

    return session.url;
  } catch (error) {
    console.error('[Stripe] Failed to create checkout session:', error);
    return null;
  }
}

/**
 * Construct webhook event with signature verification
 * Uses org-specific webhook secret if organizationId is provided
 */
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  organizationId?: string
): Promise<Stripe.Event | null> {
  const stripeInstance = organizationId ? await getStripeForOrg(organizationId) : stripe;

  if (!stripeInstance) return null;

  const webhookSecret = organizationId
    ? await getStripeWebhookSecret(organizationId)
    : process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[Stripe] Webhook secret not configured');
    return null;
  }

  try {
    return stripeInstance.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Verify Stripe API key is valid by making a test API call
 */
export async function testStripeConnection(secretKey: string): Promise<{ valid: boolean; message: string }> {
  try {
    const testStripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });

    // Make a simple API call to verify the key works
    await testStripe.balance.retrieve();

    return { valid: true, message: 'Connection successful' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    return { valid: false, message };
  }
}
