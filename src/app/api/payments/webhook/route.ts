import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, getStripeWebhookSecret } from '@/services/stripe';
import { getDb } from '@/db';

const db = getDb();
import { rentPayments, leases, units, properties } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { now } from '@/lib/utils';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // First, try to parse the body to get organizationId from metadata
    // This is safe because we'll verify the signature next
    let organizationId: string | undefined;
    try {
      const parsed = JSON.parse(body);
      organizationId = parsed?.data?.object?.metadata?.organizationId;
    } catch {
      // Ignore parsing errors
    }

    // Construct and verify the webhook event
    // Uses org-specific secret if organizationId provided, otherwise env default
    const event = await constructWebhookEvent(body, signature, organizationId);

    if (!event) {
      // If org-specific verification failed, try with global secret
      if (organizationId) {
        const globalEvent = await constructWebhookEvent(body, signature);
        if (!globalEvent) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }
        // Use the global event
        return handleEvent(globalEvent);
      }
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    return handleEvent(event);
  } catch (error) {
    console.error('[Stripe] Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case 'payment_intent.succeeded': {
      console.log('[Stripe] Payment intent succeeded');
      break;
    }
    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId || session.client_reference_id;

  if (!paymentId) {
    console.error('[Stripe] No payment ID in session');
    return;
  }

  // Get the existing payment
  const existingPayment = await db
    .select()
    .from(rentPayments)
    .where(eq(rentPayments.id, paymentId))
    .limit(1);

  if (existingPayment.length === 0) {
    console.error('[Stripe] Payment not found:', paymentId);
    return;
  }

  const payment = existingPayment[0];

  // Calculate the amount paid (Stripe returns in cents)
  const amountPaid = session.amount_total || payment.amountDue;
  const totalPaid = (payment.amountPaid || 0) + amountPaid;
  const isFullyPaid = totalPaid >= payment.amountDue;

  // Update the payment record
  await db
    .update(rentPayments)
    .set({
      status: isFullyPaid ? 'paid' : 'partial',
      amountPaid: totalPaid,
      paidAt: isFullyPaid ? now() : payment.paidAt,
      stripePaymentIntentId: session.payment_intent as string,
      updatedAt: now(),
    })
    .where(eq(rentPayments.id, paymentId));

  console.log(
    `[Stripe] Payment ${paymentId} updated - status: ${isFullyPaid ? 'paid' : 'partial'}`
  );
}
