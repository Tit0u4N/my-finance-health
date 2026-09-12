import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

const buildProps = () => ({
  open: true,
  onOpenChange: vi.fn(),
  title: 'Delete "Groceries"?',
  description: '3 transactions use this category.',
  confirmLabel: 'Delete',
  onConfirm: vi.fn(),
});

describe('ConfirmDialog', () => {
  it('renders the title and description when open', () => {
    render(<ConfirmDialog {...buildProps()} />);

    expect(screen.getByText('Delete "Groceries"?')).toBeInTheDocument();
    expect(screen.getByText('3 transactions use this category.')).toBeInTheDocument();
  });

  it('does not close on an outside click — only an explicit choice', async () => {
    const props = buildProps();
    render(<ConfirmDialog {...props} />);

    await userEvent.click(document.body);

    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it('calls onConfirm when the destructive action is pressed', async () => {
    const props = buildProps();
    render(<ConfirmDialog {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when Cancel is pressed', async () => {
    const props = buildProps();
    render(<ConfirmDialog {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Our own onClick calls onOpenChange(false) directly — one argument, not base-ui's (open, eventDetails).
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
});
