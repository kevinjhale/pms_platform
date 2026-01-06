'use client';

import { useState } from 'react';

interface PayButtonProps {
  paymentId: string;
  amountDue: number;
  disabled?: boolean;
}

export default function PayButton({ paymentId, amountDue, disabled }: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={disabled || loading}
        className="btn btn-primary"
        style={{
          opacity: disabled || loading ? 0.6 : 1,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Processing...' : `Pay $${(amountDue / 100).toLocaleString()}`}
      </button>
      {error && (
        <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}
