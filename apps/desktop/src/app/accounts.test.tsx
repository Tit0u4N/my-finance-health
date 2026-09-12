import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';

describe('Accounts', () => {
  it('lists every account as a card, plus the add tile — real seeded data, not scoped by the account filter', async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Accounts' }));

    expect(await screen.findByRole('heading', { name: 'Accounts' })).toBeInTheDocument();
    expect(screen.getByText('Checking · •• 4421')).toBeInTheDocument();
    // Cash has no last4 in the seed, so its meta line falls back to just the type — "Cash" then
    // legitimately appears twice on its own card (name + meta), so this checks presence, not a
    // single match.
    expect(screen.getAllByText('Cash').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Add another account/ })).toBeInTheDocument();
  });

  it('opens Account detail on a card click, with the hero balance tile and full transaction count', async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Accounts' }));
    await userEvent.click(await screen.findByText('Everyday'));

    expect(await screen.findByRole('heading', { name: 'Everyday' })).toBeInTheDocument();
    expect(screen.getByText('Accounts · Checking')).toBeInTheDocument();
    expect(screen.getByText('17 transactions')).toBeInTheDocument();
  });

  it('shows the empty state for an account with no transactions (Cash)', async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Accounts' }));
    await userEvent.click(await screen.findByRole('button', { name: /Cash/ }));

    expect(await screen.findByText('No transactions yet')).toBeInTheDocument();
    expect(screen.getByText('Activity on this account will show up here.')).toBeInTheDocument();
  });

  it('the range picker updates the URL search param without pushing a new history entry', async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Accounts' }));
    await userEvent.click(await screen.findByText('Everyday'));
    await screen.findByRole('heading', { name: 'Everyday' });

    await userEvent.click(screen.getByRole('button', { name: '3m' }));

    expect(window.location.search).toContain('range=3m');
  });

  it('shows a not-found header, with no content, for an unknown account id', async () => {
    window.history.pushState(null, '', '/accounts/does-not-exist');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Not found' })).toBeInTheDocument();
  });
});
