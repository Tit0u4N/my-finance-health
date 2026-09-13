import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from './DatePicker';

function renderDatePicker(overrides: Partial<Parameters<typeof DatePicker>[0]> = {}) {
  const onValueChange = vi.fn();
  render(
    <DatePicker
      label="Date"
      value=""
      onValueChange={onValueChange}
      displayValue=""
      placeholder="Pick a date"
      locale="en-US"
      previousMonthLabel="Previous month"
      nextMonthLabel="Next month"
      openCalendarLabel="Open calendar"
      {...overrides}
    />,
  );
  return { onValueChange };
}

describe('DatePicker', () => {
  it('shows the placeholder when no display value is given', () => {
    renderDatePicker();

    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('is labeled by its visible label', () => {
    renderDatePicker();

    expect(screen.getByLabelText('Date')).toBeInTheDocument();
  });

  it('opens a calendar on click and shows the formatted display value on the trigger', () => {
    renderDatePicker({ value: '2026-09-15', displayValue: 'Sep 15, 2026' });

    expect(screen.getByText('Sep 15, 2026')).toBeInTheDocument();
  });

  it('picking a day calls onValueChange with the ISO date and closes the popup', async () => {
    const { onValueChange } = renderDatePicker({ value: '2026-09-15', displayValue: 'Sep 15, 2026' });

    await userEvent.click(screen.getByLabelText('Date'));
    const day16 = await screen.findByRole('button', { name: /16/ });
    await userEvent.click(day16);

    expect(onValueChange).toHaveBeenCalledWith('2026-09-16');
  });

  it('renders the error message when present', () => {
    renderDatePicker({ error: 'Check the date' });

    expect(screen.getByText('Check the date')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toHaveAttribute('aria-invalid', 'true');
  });
});
