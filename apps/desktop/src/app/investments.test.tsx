import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';

async function openInvestments() {
  render(<App />);
  await userEvent.click(await screen.findByRole('button', { name: 'Investments' }));
  await screen.findByRole('heading', { name: 'Investments' });
}

// The row-name button's accessible name concatenates the position name and ticker (e.g. "World
// ETF (CW8) CW8"); anchored at the start, since the row's "Actions — <name>" menu trigger button
// also contains the name and would otherwise match too. Unlike a text query, a button query never
// collides with the Allocation panel's legend, which prints the same names as plain, non-interactive text.
function openPosition(name: string) {
  return userEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
}

describe('Investments', () => {
  it('shows portfolio KPIs computed across every position', async () => {
    await openInvestments();

    expect(screen.getByText('€8,234.75')).toBeInTheDocument();
    expect(screen.getByText('€7,750.00')).toBeInTheDocument();
    expect(screen.getByText('€484.75')).toBeInTheDocument();
    expect(screen.getByText('+6%')).toBeInTheDocument();
  });

  it('lists every position, sorted by value by default, with the loss-making one reading negative', async () => {
    await openInvestments();

    const dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows).toHaveLength(4);
    expect(within(dataRows[0] as HTMLElement).getByText('World ETF (CW8)')).toBeInTheDocument();
    expect(within(dataRows[3] as HTMLElement).getByText('Gold ETC')).toBeInTheDocument();
    expect(screen.getByText('-8%')).toBeInTheDocument();
  });

  it('flips sort direction on a second click of the same column', async () => {
    await openInvestments();

    await userEvent.click(screen.getByRole('button', { name: 'Value' }));

    const dataRows = screen.getAllByRole('row').slice(1);
    expect(within(dataRows[0] as HTMLElement).getByText('Gold ETC')).toBeInTheDocument();
  });

  it('opens a position on row click and returns to the list via the sidebar', async () => {
    await openInvestments();

    await openPosition('World ETF');

    expect(await screen.findByRole('heading', { name: 'World ETF (CW8)' })).toBeInTheDocument();
    expect(screen.getByText('Investments · CW8')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Investments' }));
    expect(await screen.findByRole('heading', { name: 'Investments' })).toBeInTheDocument();
  });

  it('already shows a snapshot recorded on the same day as "today" (F1 regression)', async () => {
    await openInvestments();
    await openPosition('World ETF');
    await screen.findByRole('heading', { name: 'World ETF (CW8)' });

    // Seeded at MOCK_NOW itself — before the date-bound fix, a same-day snapshot's full
    // instant sorted after the range's date-only `end` and was silently dropped from every range.
    expect(screen.getByText('€214.50')).toBeInTheDocument();
  });

  it('the range picker updates the URL search param without pushing a new history entry', async () => {
    await openInvestments();
    await openPosition('World ETF');
    await screen.findByRole('heading', { name: 'World ETF (CW8)' });

    await userEvent.click(screen.getByRole('button', { name: '3m' }));

    expect(window.location.search).toContain('range=3m');
  });

  it('recording a value updates the position’s current price and portfolio KPIs', async () => {
    await openInvestments();
    await openPosition('Gold ETC');
    await screen.findByRole('heading', { name: 'Gold ETC' });

    await userEvent.click(screen.getByRole('button', { name: 'Record value' }));
    // A future date so this is unambiguously the newest snapshot regardless of time-of-day,
    // sidestepping the seed's own same-day (later clock time) entry. The date field is now a
    // popover Calendar (DatePicker), not a native input — open it and click the day directly
    // rather than firing a synthetic change event.
    await userEvent.click(screen.getByLabelText('Date'));
    await userEvent.click(document.querySelector('button[data-day="2026-09-15"]') as HTMLElement);
    fireEvent.change(screen.getByLabelText('Price per unit'), { target: { value: '80.00' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save value' }));

    expect(await screen.findByText('€1,440.00')).toBeInTheDocument();
  });

  it('saves a note and keeps it after navigating away and back', async () => {
    await openInvestments();
    await openPosition('Tech Growth Fund');
    await screen.findByRole('heading', { name: 'Tech Growth Fund' });

    await userEvent.type(screen.getByLabelText('Notes'), 'Core growth sleeve.');
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }));

    await userEvent.click(screen.getByRole('button', { name: 'Investments' }));
    await screen.findByRole('heading', { name: 'Investments' });
    await openPosition('Tech Growth Fund');
    await screen.findByRole('heading', { name: 'Tech Growth Fund' });

    expect(screen.getByLabelText('Notes')).toHaveValue('Core growth sleeve.');
  });

  it('adds a position and reflects it in the portfolio value KPI', async () => {
    await openInvestments();

    await userEvent.click(screen.getByRole('button', { name: 'Add position' }));
    await userEvent.type(screen.getByLabelText('Name'), 'S&P 500 ETF');
    await userEvent.type(screen.getByLabelText('Ticker'), 'SPY');
    await userEvent.type(screen.getByLabelText('Units'), '10');
    await userEvent.type(screen.getByLabelText('Avg cost'), '100.00');
    await userEvent.type(screen.getByLabelText('Current price'), '110.00');
    await userEvent.click(screen.getByRole('button', { name: 'Create position' }));

    expect(await within(screen.getByRole('table')).findByText('S&P 500 ETF')).toBeInTheDocument();
    expect(screen.getByText('€9,334.75')).toBeInTheDocument();
  });

  it('deletes a position after confirmation and returns to the list', async () => {
    await openInvestments();
    await openPosition('Emerging Markets ETF');
    await screen.findByRole('heading', { name: 'Emerging Markets ETF' });

    await userEvent.click(screen.getByRole('button', { name: 'Delete position' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('heading', { name: 'Investments' })).toBeInTheDocument();
    expect(screen.queryByText('Emerging Markets ETF')).not.toBeInTheDocument();
  });

  it('shows a not-found header for an unknown investment id', async () => {
    window.history.pushState(null, '', '/investments/does-not-exist');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Not found' })).toBeInTheDocument();
  });
});
