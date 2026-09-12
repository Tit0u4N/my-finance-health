import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Moon, Sun } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { OptionGrid } from './OptionGrid';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

describe('OptionGrid', () => {
  it('marks only the selected option as checked', () => {
    render(<OptionGrid value="dark" onChange={() => undefined} options={OPTIONS} columns={2} ariaLabel="Theme" />);

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
  });

  it('fires onChange with the clicked option value', async () => {
    const onChange = vi.fn();
    render(<OptionGrid value="dark" onChange={onChange} options={OPTIONS} columns={2} ariaLabel="Theme" />);

    await userEvent.click(screen.getByRole('radio', { name: 'Light' }));

    expect(onChange.mock.calls[0]?.[0]).toBe('light');
  });

  it('moves the checked state with the arrow keys', async () => {
    render(<OptionGrid value="dark" onChange={() => undefined} options={OPTIONS} columns={2} ariaLabel="Theme" />);

    screen.getByRole('radio', { name: 'Dark' }).focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus();
  });
});
