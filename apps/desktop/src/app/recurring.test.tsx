import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';

async function openRecurring() {
  render(<App />);
  await userEvent.click(await screen.findByRole('button', { name: 'Recurring' }));
  await screen.findByRole('heading', { name: 'Recurring' });
}

describe('Recurring', () => {
  it('shows the normalized monthly commitment KPIs, excluding the paused rule', async () => {
    await openRecurring();

    // Also the raw amount of the Salary rule, whose Monthly factor is 1 — genuinely the same text twice.
    expect(screen.getAllByText('€3,400.00').length).toBeGreaterThan(0);
    expect(screen.getByText('€1,304.48')).toBeInTheDocument();
    expect(screen.getByText('€2,095.52')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByText('€1,334.38')).not.toBeInTheDocument();
    expect(screen.getByText('5 rules')).toBeInTheDocument();
  });

  it('orders rows by next occurrence and lists the paused rule with its switch unchecked', async () => {
    await openRecurring();

    const dataRows = screen.getAllByRole('row').slice(1);
    expect(within(dataRows[0] as HTMLElement).getByText('Netflix')).toBeInTheDocument();
    expect(within(dataRows[4] as HTMLElement).getByText('Spotify Family')).toBeInTheDocument();

    expect(screen.getByRole('switch', { name: 'Active — Gym — Basic Fit' })).not.toBeChecked();
  });

  it('toggling a paused rule active updates the monthly-out KPI and active count', async () => {
    await openRecurring();

    await userEvent.click(screen.getByRole('switch', { name: 'Active — Gym — Basic Fit' }));

    expect(await screen.findByText('€1,334.38')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('creates a new rule and reflects it in the monthly-out KPI', async () => {
    await openRecurring();

    await userEvent.click(screen.getByRole('button', { name: 'New rule' }));
    await userEvent.type(screen.getByLabelText('Amount'), '9.99');
    await userEvent.type(screen.getByLabelText('Description'), 'Disney+');
    await userEvent.click(screen.getByRole('radio', { name: 'Subscriptions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create rule' }));

    expect(await screen.findByText('Disney+')).toBeInTheDocument();
    expect(screen.getByText('€1,314.47')).toBeInTheDocument();
  });

  it('deletes a rule after confirmation', async () => {
    await openRecurring();

    await userEvent.click(screen.getByRole('button', { name: 'Actions — Netflix' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('€1,290.99')).toBeInTheDocument();
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
  });

  it('shows an empty state once the account scope excludes every account carrying rules', async () => {
    await openRecurring();

    await userEvent.click(screen.getByRole('button', { name: 'All accounts' }));
    const checkboxes = await screen.findAllByRole('checkbox');
    await userEvent.click(checkboxes[0] as HTMLElement);
    await userEvent.click(checkboxes[1] as HTMLElement);

    expect(await screen.findByText('No recurring rules')).toBeInTheDocument();
  });
});
