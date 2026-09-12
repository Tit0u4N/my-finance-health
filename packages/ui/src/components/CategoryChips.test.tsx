import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoryChips } from './CategoryChips';

const GROCERIES_COLOR = '#F59E0B';
const TRANSPORT_COLOR = '#06B6D4';
const ITEMS = [
  { id: 'c-grc', name: 'Groceries', color: GROCERIES_COLOR },
  { id: 'c-tra', name: 'Transport', color: TRANSPORT_COLOR },
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

  it("tints the checked chip with the category's own color, not a fixed accent", () => {
    render(<CategoryChips items={ITEMS} value="c-grc" onChange={() => undefined} ariaLabel="Category" />);

    const checked = screen.getByRole('radio', { name: 'Groceries' });
    const unchecked = screen.getByRole('radio', { name: 'Transport' });

    // jsdom normalizes an inline hex color to rgb() on read-back, so compare against that form.
    expect(checked.style.color).toBe('rgb(245, 158, 11)');
    expect(unchecked.style.color).not.toBe('rgb(6, 182, 212)');
  });
});
