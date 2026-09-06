import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import CallPartyButton from '../components/CallPartyButton';
import ErrorAlert from '../components/ErrorAlert';
import Spinner from '../components/Spinner';

// ── StatusBadge ───────────────────────────────────────────────────────────────
describe('StatusBadge', () => {
  it('renders Active badge', () => {
    render(<StatusBadge status="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders Disposed badge', () => {
    render(<StatusBadge status="Disposed" />);
    expect(screen.getByText('Disposed')).toBeInTheDocument();
  });

  it('renders Stayed badge', () => {
    render(<StatusBadge status="Stayed" />);
    expect(screen.getByText('Stayed')).toBeInTheDocument();
  });
});

// ── CallPartyButton ───────────────────────────────────────────────────────────
describe('CallPartyButton', () => {
  it('renders a tel: link with the mobile number', () => {
    render(<CallPartyButton mobile="9876543210" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'tel:9876543210');
  });

  it('renders nothing when no mobile provided', () => {
    const { container } = render(<CallPartyButton mobile="" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows Call Party text', () => {
    render(<CallPartyButton mobile="1234567890" />);
    expect(screen.getByText('Call Party')).toBeInTheDocument();
  });
});

// ── ErrorAlert ────────────────────────────────────────────────────────────────
describe('ErrorAlert', () => {
  it('renders error message', () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders nothing when no message', () => {
    const { container } = render(<ErrorAlert message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onDismiss when dismiss button clicked', async () => {
    const dismiss = vi.fn();
    render(<ErrorAlert message="Error" onDismiss={dismiss} />);
    screen.getByText('✕').click();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});

// ── Spinner ───────────────────────────────────────────────────────────────────
describe('Spinner', () => {
  it('shows default loading text', () => {
    render(<Spinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows custom text', () => {
    render(<Spinner text="Fetching cases..." />);
    expect(screen.getByText('Fetching cases...')).toBeInTheDocument();
  });
});
