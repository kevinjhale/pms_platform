import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileMenuProvider, useMobileMenu } from '@/components/MobileMenuProvider';

// Test component that uses the context
function TestConsumer() {
  const { isOpen, toggle, close } = useMobileMenu();
  return (
    <div>
      <span data-testid="status">{isOpen ? 'open' : 'closed'}</span>
      <button onClick={toggle}>Toggle</button>
      <button onClick={close}>Close</button>
    </div>
  );
}

describe('MobileMenuProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial closed state', () => {
    render(
      <MobileMenuProvider>
        <TestConsumer />
      </MobileMenuProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });

  it('toggles menu state', () => {
    render(
      <MobileMenuProvider>
        <TestConsumer />
      </MobileMenuProvider>
    );

    const toggleButton = screen.getByText('Toggle');

    fireEvent.click(toggleButton);
    expect(screen.getByTestId('status')).toHaveTextContent('open');

    fireEvent.click(toggleButton);
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });

  it('closes menu when close is called', () => {
    render(
      <MobileMenuProvider>
        <TestConsumer />
      </MobileMenuProvider>
    );

    const toggleButton = screen.getByText('Toggle');
    const closeButton = screen.getByText('Close');

    fireEvent.click(toggleButton); // Open
    expect(screen.getByTestId('status')).toHaveTextContent('open');

    fireEvent.click(closeButton);
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });

  it('renders floating action button', () => {
    render(
      <MobileMenuProvider>
        <div>Content</div>
      </MobileMenuProvider>
    );

    const fab = screen.getByRole('button', { name: /open menu/i });
    expect(fab).toBeInTheDocument();
  });

  it('renders overlay', () => {
    render(
      <MobileMenuProvider>
        <TestConsumer />
      </MobileMenuProvider>
    );

    const overlay = document.querySelector('.sidebar-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('closes on escape key', () => {
    render(
      <MobileMenuProvider>
        <TestConsumer />
      </MobileMenuProvider>
    );

    const toggleButton = screen.getByText('Toggle');
    fireEvent.click(toggleButton); // Open
    expect(screen.getByTestId('status')).toHaveTextContent('open');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });

  it('closes when overlay is clicked', () => {
    render(
      <MobileMenuProvider>
        <TestConsumer />
      </MobileMenuProvider>
    );

    const toggleButton = screen.getByText('Toggle');
    fireEvent.click(toggleButton); // Open

    const overlay = document.querySelector('.sidebar-overlay');
    fireEvent.click(overlay!);

    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });
});
