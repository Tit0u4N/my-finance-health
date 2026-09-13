import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';

async function openTransactions() {
  render(<App />);
  await userEvent.click(await screen.findByRole('button', { name: 'Transactions' }));
  await screen.findByRole('heading', { name: 'Transactions' });
}

describe('Transactions', () => {
  it('shows the unfiltered ledger with correct inflow/outflow/net KPIs against the seed', async () => {
    await openTransactions();

    expect(screen.getByText('€4,618.40')).toBeInTheDocument();
    expect(screen.getByText('€1,663.72')).toBeInTheDocument();
    expect(screen.getByText('€2,954.68')).toBeInTheDocument();
    expect(screen.getByText('18 transactions')).toBeInTheDocument();
  });

  it('filters to income only', async () => {
    await openTransactions();

    await userEvent.click(screen.getByRole('combobox', { name: 'Type' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Income' }));

    expect(await screen.findByText('3 transactions')).toBeInTheDocument();
    expect(screen.queryByText('Carrefour Market')).not.toBeInTheDocument();
    expect(screen.getByText('Salaire — Studio Nord')).toBeInTheDocument();
  });

  it('filters to a single category', async () => {
    await openTransactions();

    await userEvent.click(screen.getByRole('combobox', { name: 'Category' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Groceries' }));

    expect(await screen.findByText('3 transactions')).toBeInTheDocument();
    expect(screen.getByText('Carrefour Market')).toBeInTheDocument();
    expect(screen.getByText('Monoprix')).toBeInTheDocument();
    expect(screen.getByText('Auchan')).toBeInTheDocument();
  });

  it('debounces the search box into a single URL update, without pushing history per keystroke', async () => {
    await openTransactions();
    const historyLengthBefore = window.history.length;

    await userEvent.type(screen.getByPlaceholderText('Search description…'), 'netflix');

    expect(await screen.findByText('1 transaction')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(window.location.search).toContain('q=netflix');
    expect(window.history.length).toBe(historyLengthBefore);
  });

  it('sorts by amount, toggling direction on a second click', async () => {
    await openTransactions();

    await userEvent.click(screen.getByRole('button', { name: 'Amount' }));
    let dataRows = screen.getAllByRole('row').slice(1);
    expect(within(dataRows[0] as HTMLElement).getByText('Salaire — Studio Nord')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Amount' }));
    dataRows = screen.getAllByRole('row').slice(1);
    expect(within(dataRows[0] as HTMLElement).getByText('Loyer — septembre')).toBeInTheDocument();
  });

  it('creates an expense transaction with the sign derived from its category', async () => {
    await openTransactions();

    await userEvent.click(screen.getByRole('button', { name: 'New transaction' }));
    await userEvent.type(screen.getByLabelText('Amount'), '12.50');
    // Esc closes the description Autocomplete's suggestion popup — while open, base-ui marks the
    // rest of the dialog inert, hiding the category radios and submit button from the a11y tree.
    await userEvent.type(screen.getByLabelText('Description'), 'Test lunch{Escape}');
    await userEvent.click(screen.getByRole('radio', { name: 'Eating out' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create transaction' }));

    expect(await screen.findByText('Test lunch')).toBeInTheDocument();
    expect(screen.getByText('-€12.50')).toBeInTheDocument();
    expect(screen.getByText('19 transactions')).toBeInTheDocument();
  });

  it('the income tab offers only income categories and submits a positive amount', async () => {
    await openTransactions();

    await userEvent.click(screen.getByRole('button', { name: 'New transaction' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Income' }));

    expect(screen.getByRole('radio', { name: 'Salary' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Freelance' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Interest' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Rent' })).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Amount'), '50');
    await userEvent.type(screen.getByLabelText('Description'), 'Test income{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Create transaction' }));

    expect(await screen.findByText('Test income')).toBeInTheDocument();
    expect(screen.getByText('€50.00')).toBeInTheDocument();
    expect(screen.queryByText('Could not create the transaction. Try again.')).not.toBeInTheDocument();
  });

  it('editing a transaction across kinds re-signs the amount instead of erroring', async () => {
    await openTransactions();

    await userEvent.click(screen.getByRole('button', { name: 'Actions — Carrefour Market' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    await userEvent.click(await screen.findByRole('tab', { name: 'Income' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('€54.20')).toBeInTheDocument();
    expect(screen.queryByText('Edit transaction')).not.toBeInTheDocument();
  });

  it('deletes a transaction after confirmation', async () => {
    await openTransactions();

    await userEvent.click(screen.getByRole('button', { name: 'Actions — Carrefour Market' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('17 transactions')).toBeInTheDocument();
    expect(screen.queryByText('Carrefour Market')).not.toBeInTheDocument();
  });

  it('shows an empty state once the account scope excludes every account with transactions', async () => {
    await openTransactions();

    await userEvent.click(screen.getByRole('button', { name: 'All accounts' }));
    const checkboxes = await screen.findAllByRole('checkbox');
    await userEvent.click(checkboxes[0] as HTMLElement);
    await userEvent.click(checkboxes[1] as HTMLElement);

    expect(await screen.findByText('No transactions match')).toBeInTheDocument();
  });
});
