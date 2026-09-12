import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('reflects the checked prop', () => {
    render(<Switch checked onCheckedChange={() => undefined} aria-label="Active" />);

    expect(screen.getByRole('switch', { name: 'Active' })).toBeChecked();
  });

  it('fires onCheckedChange on click', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} aria-label="Active" />);

    await userEvent.click(screen.getByRole('switch', { name: 'Active' }));

    // base-ui calls onCheckedChange(checked, eventDetails) — only the first argument is ours to assert on.
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true);
  });

  it('toggles on Space when focused', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} aria-label="Active" />);

    screen.getByRole('switch', { name: 'Active' }).focus();
    await userEvent.keyboard('[Space]');

    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true);
  });

  it('does not fire when disabled', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} disabled aria-label="Active" />);

    await userEvent.click(screen.getByRole('switch', { name: 'Active' }));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
