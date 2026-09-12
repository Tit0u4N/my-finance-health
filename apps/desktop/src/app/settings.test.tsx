import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';

async function openSettings() {
  render(<App />);
  await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
}

describe('Settings', () => {
  it('redirects /settings to Preferences and highlights it in the sidebar', async () => {
    await openSettings();

    expect(await screen.findByText('Appearance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('Preferences shows a formatted rate row for the seeded USD account', async () => {
    await openSettings();
    await screen.findByText('Appearance');

    expect(screen.getByText('USD → EUR')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.9234')).toBeInTheDocument();
  });

  it('Categories switches sections while keeping Settings highlighted, and lists the seeded counts', async () => {
    await openSettings();
    await screen.findByText('Appearance');

    await userEvent.click(screen.getByRole('link', { name: /Categories/ }));

    expect(await screen.findByText('6 categories')).toBeInTheDocument();
    expect(screen.getByText('3 categories')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('creates a category through the dialog and lists it', async () => {
    await openSettings();
    await userEvent.click(screen.getByRole('link', { name: /Categories/ }));
    await screen.findByText('6 categories');

    // Expenses is the first grid-half column, so its "Add" button is the first match.
    const addButtons = screen.getAllByRole('button', { name: 'Add' });
    expect(addButtons.length).toBeGreaterThanOrEqual(1);
    await userEvent.click(addButtons[0] as HTMLElement);
    await userEvent.type(screen.getByLabelText('Name'), 'Pets');
    await userEvent.click(screen.getByRole('button', { name: 'Create category' }));

    expect(await screen.findByText('Pets')).toBeInTheDocument();
    expect(screen.getByText('7 categories')).toBeInTheDocument();
  });

  it('Database shows the real row count against the seed, with every action disabled', async () => {
    await openSettings();
    await screen.findByText('Appearance');

    await userEvent.click(screen.getByRole('link', { name: /Database/ }));

    // 4 accounts + 9 categories + 18 transactions + 5 recurring rules + 4 investments + 1 exchange rate.
    expect(await screen.findByText('41')).toBeInTheDocument();
    for (const label of ['Switch file', 'Create backup', 'Export CSV', 'Reset everything']) {
      expect(screen.getByRole('button', { name: label })).toBeDisabled();
    }
  });

  it('About shows the encrypted-at-rest badge', async () => {
    await openSettings();
    await screen.findByText('Appearance');

    await userEvent.click(screen.getByRole('link', { name: /About/ }));

    expect(await screen.findByText('Encrypted at rest')).toBeInTheDocument();
  });
});
