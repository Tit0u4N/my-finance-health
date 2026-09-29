// Mirrors DashboardScreen.test.tsx's shape and its documented skip (see that file's docblock).

import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AccountDetailScreen } from './AccountDetailScreen';

async function renderDetail(accountId: string): Promise<void> {
  const { platform, repositories } = createMockWorkspace();
  const queryClient = new QueryClient();

  await render(
    <ThemeProvider>
      <AppStageProviders platform={platform} queryClient={queryClient} repositories={repositories}>
        <AccountDetailScreen accountId={accountId} onBack={() => {}} />
      </AppStageProviders>
    </ThemeProvider>,
  );
}

describe('AccountDetailScreen', () => {
  // Skipped: see DashboardScreen.test.tsx's docblock for the underlying cross-app-pitfall.
  it.skip('renders the account identity and balance for a seeded account', async () => {
    await renderDetail('a1');

    expect(await screen.findByText('Everyday')).toBeTruthy();
    expect(screen.getByText(/Accounts · Checking/)).toBeTruthy();
  });

  // Skipped: same cross-app-pitfall — this covers the ViewModel's `found: false` arm rendering.
  it.skip('renders a not-found state for an unknown account id', async () => {
    await renderDetail('does-not-exist');

    expect(await screen.findByText('Not found')).toBeTruthy();
  });
});
