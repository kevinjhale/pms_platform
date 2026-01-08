import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCheckoutSession, isStripeConfiguredForOrg } from '@/services/stripe';
import { getDb } from '@/db';

const db = getDb();
import { rentPayments, leases, units, properties } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      );
    }

    // Get payment details with property info and organization
    const paymentResult = await db
      .select({
        payment: rentPayments,
        propertyName: properties.name,
        organizationId: properties.organizationId,
        tenantId: leases.tenantId,
      })
      .from(rentPayments)
      .innerJoin(leases, eq(rentPayments.leaseId, leases.id))
      .innerJoin(units, eq(leases.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(eq(rentPayments.id, paymentId))
      .limit(1);

    if (paymentResult.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const { payment, propertyName, organizationId, tenantId } = paymentResult[0];

    // Check if Stripe is configured for this organization
    if (!(await isStripeConfiguredForOrg(organizationId))) {
      return NextResponse.json(
        { error: 'Payments not configured' },
        { status: 503 }
      );
    }

    // Verify the user is the tenant
    if (tenantId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if payment is already paid
    if (payment.status === 'paid') {
      return NextResponse.json(
        { error: 'Payment already completed' },
        { status: 400 }
      );
    }

    // Calculate amount due (subtract any partial payments)
    const amountDue = payment.amountDue - (payment.amountPaid || 0);

    // Format period label
    const periodDate = new Date(payment.periodStart);
    const periodLabel = periodDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const checkoutUrl = await createCheckoutSession({
      paymentId: payment.id,
      userId: session.user.id,
      amount: amountDue,
      propertyName,
      periodLabel,
      successUrl: `${baseUrl}/renter/payments?success=true&payment=${payment.id}`,
      cancelUrl: `${baseUrl}/renter/payments?cancelled=true`,
      organizationId,
    });

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
