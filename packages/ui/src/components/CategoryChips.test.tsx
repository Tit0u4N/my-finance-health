import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoryChips } from './CategoryChips';

const ITEMS = [
  { id: 'c-grc', name: 'Groceries', color: '#F59E0B' },
  { id: 'c-tra', name: 'Transport', color: '#06B6D4' },
];

describe('CategoryChips', () => {
  it('marks only the selected chip as checked', () => {
    render(<CategoryChips items={ITEMS} value="c-grc" onChange={() => undefined} ariaLabel="Category" />);

    expect(screen.getByRole('radio', { name: 'Groceries' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Transport' })).not.toBeChecked();
  });

  it('fires onChange with the clicked chip id', async () => {
    const onChange = vi.fn();
    render(<CategoryChips items={ITEMS} value="c-grc" onChange={onChange} ariaLabel="Category" />);

    await userEvent.click(screen.getByRole('radio', { name: 'Transport' }));

    expect(onChange).toHaveBeenCalledWith('c-tra');
  });

  it('moves the checked state with the arrow keys', async () => {
    render(<CategoryChips items={ITEMS} value="c-grc" onChange={() => undefined} ariaLabel="Category" />);

    screen.getByRole('radio', { name: 'Groceries' }).focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: 'Transport' })).toHaveFocus();
  });
});
