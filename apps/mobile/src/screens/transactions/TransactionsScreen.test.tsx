// Mirrors DashboardScreen.test.tsx / apps/desktop's App.test.tsx: the app layer is tested on
// composition and presentation only. The day grouping and the criteria builder have their own real,
// passing unit tests next door (`groupTransactionsByDay.test.ts`, `ledgerCriteria.test.ts`), and
// every derived number is already covered in @repo/app-core.
//
// The fixture seed reaches both states of every branch asserted here (docs/spec/cross-app-pitfalls.md
// #6): 18 transactions spread over ~4 weeks (so both the relative and the absolute day label
// appear), and 5 recurring rules of which `r5` — "Gym — Basic Fit" — is paused, so the active
// toggle's off state is reachable and not just claimed.

import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { TransactionsScreen } from './TransactionsScreen';

async function renderActivity(): Promise<void> {
  const { platform, repositories } = createMockWorkspace();
  const queryClient = new QueryClient();

  await render(
    <ThemeProvider>
      <AppStageProviders platform={platform} queryClient={queryClient} repositories={repositories}>
        <TransactionsScreen />
      </AppStageProviders>
    </ThemeProvider>,
  );
}

describe('TransactionsScreen', () => {
  // Skipped: same cross-app-pitfall as DashboardScreen.test.tsx — see
  // docs/spec/cross-app-pitfalls.md #9. This screen reads `usePreferencesStore` (amounts-hidden) and
  // `useTranslation`, so mounting `AppStageProviders` here resolves a second physical React through
  // @repo/app-core's own nested install and throws "Invalid hook call". Not a product bug: Metro
  // bundles one React for a real build. Left as a real, skipped test rather than a fake pass.
  it.skip('renders the ledger segment grouped by day', async () => {
    await renderActivity();

    expect(await screen.findByText('Activity')).toBeTruthy();
    expect(screen.getByText('Transactions')).toBeTruthy();
    expect(screen.getByText('Recurring')).toBeTruthy();
    // Seeded at the fixture's "today" (mockSeed offset 0) and one day back (offset -1).
    expect(await screen.findByText('Carrefour Market')).toBeTruthy();
    expect(screen.getByText('Métro pass')).toBeTruthy();
    // The day label comes from `formatRelativeDate`, never a hand-built string.
    expect(screen.getByText('today')).toBeTruthy();
    expect(screen.getByText('yesterday')).toBeTruthy();
  });

  // Skipped: same cross-app-pitfall, see the skip above.
  it.skip('narrows the ledger through the search field', async () => {
    const user = userEvent.setup();
    await renderActivity();

    await user.type(await screen.findByPlaceholderText('Search description…'), 'Monoprix');

    expect(await screen.findByText('Monoprix')).toBeTruthy();
    expect(screen.queryByText('Carrefour Market')).toBeNull();
  });

  // Skipped: same cross-app-pitfall, see the skip above.
  it.skip('shows every rule, paused ones included, on the recurring segment', async () => {
    const user = userEvent.setup();
    await renderActivity();

    await user.press(await screen.findByText('Recurring'));

    expect(await screen.findByText('Rent')).toBeTruthy();
    // `r5` is seeded `active: false` — the paused branch is genuinely reachable.
    expect(screen.getByText('Gym — Basic Fit')).toBeTruthy();
    expect(screen.getByLabelText('Active — Gym — Basic Fit')).toBeTruthy();
  });

  // Skipped: same cross-app-pitfall, see the skip above.
  it.skip('opens the create sheet from the header action, titled for the visible segment', async () => {
    const user = userEvent.setup();
    await renderActivity();

    await user.press(await screen.findByLabelText('New transaction'));
    expect(await screen.findByText('Create transaction')).toBeTruthy();
    await user.press(screen.getByLabelText('Close'));

    await user.press(screen.getByText('Recurring'));
    await user.press(await screen.findByLabelText('New rule'));
    expect(await screen.findByText('Create rule')).toBeTruthy();
  });

  // Skipped: same cross-app-pitfall, see the skip above.
  it.skip('confirms before deleting a transaction', async () => {
    const user = userEvent.setup();
    await renderActivity();

    await user.press(await screen.findByLabelText('Actions — Carrefour Market'));
    await user.press(await screen.findByText('Delete'));

    expect(await screen.findByText('Delete "Carrefour Market"?')).toBeTruthy();
  });
});
