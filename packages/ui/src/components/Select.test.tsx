import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

const OPTIONS = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
] as const;

describe('Select', () => {
  it('shows the label of the currently selected option on the trigger', () => {
    render(<Select value="EUR" onValueChange={() => undefined} options={OPTIONS} label="Currency" />);

    expect(screen.getByRole('combobox')).toHaveTextContent('EUR');
  });

  it('opens the popup and fires onValueChange with the chosen option', async () => {
    const onValueChange = vi.fn();
    render(<Select value="EUR" onValueChange={onValueChange} options={OPTIONS} label="Currency" />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'USD' }));

    // base-ui calls onValueChange(value, eventDetails) — only the first argument is ours to assert on.
    expect(onValueChange.mock.calls[0]?.[0]).toBe('USD');
  });
});
