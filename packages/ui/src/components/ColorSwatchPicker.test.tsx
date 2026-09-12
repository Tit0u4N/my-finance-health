import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CATEGORY_SWATCHES, ColorSwatchPicker } from './ColorSwatchPicker';

describe('ColorSwatchPicker', () => {
  it('renders one swatch per entry in the default palette', () => {
    render(<ColorSwatchPicker value={CATEGORY_SWATCHES[0] as string} onChange={() => undefined} />);

    expect(screen.getAllByRole('radio')).toHaveLength(CATEGORY_SWATCHES.length);
  });

  it('checks the swatch matching the current value', () => {
    const value = CATEGORY_SWATCHES[2] as string;
    render(<ColorSwatchPicker value={value} onChange={() => undefined} />);

    expect(screen.getByRole('radio', { name: value })).toBeChecked();
  });

  it('fires onChange with the clicked swatch', async () => {
    const onChange = vi.fn();
    const target = CATEGORY_SWATCHES[3] as string;
    render(<ColorSwatchPicker value={CATEGORY_SWATCHES[0] as string} onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: target }));

    expect(onChange.mock.calls[0]?.[0]).toBe(target);
  });
});
