import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} onOpenChange={() => undefined} title="New account" closeLabel="Close">
        Body
      </Dialog>,
    );

    expect(screen.queryByText('New account')).not.toBeInTheDocument();
  });

  it('renders the title, subtitle and children when open', () => {
    render(
      <Dialog
        open
        onOpenChange={() => undefined}
        title="New account"
        subtitle="Balances update as you record transactions"
        closeLabel="Close"
      >
        Body content
      </Dialog>,
    );

    expect(screen.getByText('New account')).toBeInTheDocument();
    expect(screen.getByText('Balances update as you record transactions')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) on Escape', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="New account" closeLabel="Close">
        Body
      </Dialog>,
    );

    await userEvent.keyboard('{Escape}');

    // base-ui calls onOpenChange(open, eventDetails) — only the first argument is ours to assert on.
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
  });
});
