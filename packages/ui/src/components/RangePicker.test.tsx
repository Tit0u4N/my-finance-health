import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RangePicker } from './RangePicker';

const OPTIONS = [
  { value: '7d', label: '7d' },
  { value: '1m', label: '1m' },
  { value: '3m', label: '3m' },
] as const;

describe('RangePicker', () => {
  it('renders one button per option', () => {
    render(<RangePicker value="1m" onChange={() => undefined} options={OPTIONS} ariaLabel="History range" />);

    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('fires onChange with the pressed option value', async () => {
    const onChange = vi.fn();
    render(<RangePicker value="1m" onChange={onChange} options={OPTIONS} ariaLabel="History range" />);

    await userEvent.click(screen.getByRole('button', { name: '3m' }));

    expect(onChange).toHaveBeenCalledWith('3m');
  });
});
