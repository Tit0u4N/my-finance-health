// Mirrors DashboardScreen.test.tsx's shape and its documented skip — the app layer is tested on
// composition and presentation only, every derived number already has its own test in
// @repo/app-core, and this screen reads `usePreferencesStore` (`amountsHidden`), which hits the
// same dual-React "Invalid hook call" under vitest-native (docs/spec/cross-app-pitfalls.md #9).

import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AccountsScreen } from './AccountsScreen';

async function renderAccounts(): Promise<void> {
  const { platform, repositories } = createMockWorkspace();
  const queryClient = new QueryClient();

  await render(
    <ThemeProvider>
      <AppStageProviders platform={platform} queryClient={queryClient} repositories={repositories}>
        <AccountsScreen onOpenAccount={() => {}} />
      </AppStageProviders>
    </ThemeProvider>,
  );
}

describe('AccountsScreen', () => {
  // Skipped: see DashboardScreen.test.tsx's docblock for the underlying cross-app-pitfall.
  it.skip('renders one card per seeded account', async () => {
    await renderAccounts();

    expect(await screen.findByText('Accounts')).toBeTruthy();
    // Seeded accounts (createMockWorkspace.ts's mockSeed).
    expect(screen.getByText('Everyday')).toBeTruthy();
    expect(screen.getByText('Reserve')).toBeTruthy();
  });
});
