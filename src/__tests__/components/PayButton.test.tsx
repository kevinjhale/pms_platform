import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PayButton from '@/components/PayButton';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('PayButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  it('renders with correct amount', () => {
    render(<PayButton paymentId="test-123" amountDue={150000} />);
    expect(screen.getByText('Pay $1,500')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<PayButton paymentId="test-123" amountDue={150000} disabled />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows loading state during payment', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PayButton paymentId="test-123" amountDue={150000} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  it('redirects to checkout URL on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/test' }),
    });

    render(<PayButton paymentId="test-123" amountDue={150000} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockLocation.href).toBe('https://checkout.stripe.com/test');
    });
  });

  it('shows error message on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Payment failed' }),
    });

    render(<PayButton paymentId="test-123" amountDue={150000} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });
  });

  it('sends correct payment ID in request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/test' }),
    });

    render(<PayButton paymentId="payment-abc-123" amountDue={150000} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: 'payment-abc-123' }),
      });
    });
  });
});
