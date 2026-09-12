import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs';

const ITEMS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
] as const;

describe('Tabs', () => {
  it('marks only the active tab as selected', () => {
    render(<Tabs value="expense" onValueChange={() => undefined} items={ITEMS} ariaLabel="Type" />);

    expect(screen.getByRole('tab', { name: 'Expense' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Income' })).toHaveAttribute('aria-selected', 'false');
  });

  it('fires onValueChange with the clicked tab value', async () => {
    const onValueChange = vi.fn();
    render(<Tabs value="expense" onValueChange={onValueChange} items={ITEMS} ariaLabel="Type" />);

    await userEvent.click(screen.getByRole('tab', { name: 'Income' }));

    expect(onValueChange).toHaveBeenCalledWith('income');
  });

  it('moves focus with the arrow keys', async () => {
    render(<Tabs value="expense" onValueChange={() => undefined} items={ITEMS} ariaLabel="Type" />);

    screen.getByRole('tab', { name: 'Expense' }).focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Income' })).toHaveFocus();
  });
});
