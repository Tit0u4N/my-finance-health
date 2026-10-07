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
import { InvestmentsScreen } from './InvestmentsScreen';

async function renderInvest(): Promise<void> {
  const { platform, repositories } = createMockWorkspace();
  const queryClient = new QueryClient();

  await render(
    <ThemeProvider>
      <AppStageProviders platform={platform} queryClient={queryClient} repositories={repositories}>
        <InvestmentsScreen onOpenInvestment={() => {}} />
      </AppStageProviders>
    </ThemeProvider>,
  );
}

describe('InvestmentsScreen', () => {
  // Skipped: see DashboardScreen.test.tsx's docblock for the underlying cross-app-pitfall.
  it.skip('renders the portfolio hero and the seeded positions', async () => {
    await renderInvest();

    expect(await screen.findByText('Investments')).toBeTruthy();
  });
});
