import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Calendar } from './Calendar';

describe('Calendar', () => {
  it('shows the selected month using the given locale', () => {
    render(
      <Calendar
        value="2026-09-15"
        onValueChange={() => undefined}
        locale="en-US"
        previousMonthLabel="Previous month"
        nextMonthLabel="Next month"
      />,
    );

    expect(screen.getByText('September 2026')).toBeInTheDocument();
  });

  it('selecting a day fires onValueChange with the ISO date', async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        value="2026-09-15"
        onValueChange={onValueChange}
        locale="en-US"
        previousMonthLabel="Previous month"
        nextMonthLabel="Next month"
      />,
    );

    const day16 = document.querySelector('button[data-day="2026-09-16"]') as HTMLElement;
    await userEvent.click(day16);

    expect(onValueChange).toHaveBeenCalledWith('2026-09-16');
  });

  it('paging to the next month updates the caption', async () => {
    render(
      <Calendar
        value="2026-09-15"
        onValueChange={() => undefined}
        locale="en-US"
        previousMonthLabel="Previous month"
        nextMonthLabel="Next month"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));

    expect(screen.getByText('October 2026')).toBeInTheDocument();
  });

  it('disables dates outside the given min/max bounds', () => {
    render(
      <Calendar
        value="2026-09-15"
        onValueChange={() => undefined}
        locale="en-US"
        min="2026-09-10"
        max="2026-09-20"
        previousMonthLabel="Previous month"
        nextMonthLabel="Next month"
      />,
    );

    const day5 = document.querySelector('button[data-day="2026-09-05"]') as HTMLButtonElement;
    const day25 = document.querySelector('button[data-day="2026-09-25"]') as HTMLButtonElement;
    const day15 = document.querySelector('button[data-day="2026-09-15"]') as HTMLButtonElement;

    expect(day5).toBeDisabled();
    expect(day25).toBeDisabled();
    expect(day15).not.toBeDisabled();
  });
});
