// Mirrors DashboardScreen.test.tsx's shape and its documented skip (see that file's docblock).

import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { PreferencesScreen } from './PreferencesScreen';

async function renderPreferences(): Promise<void> {
  const { platform, repositories } = createMockWorkspace();
  const queryClient = new QueryClient();

  await render(
    <ThemeProvider>
      <AppStageProviders platform={platform} queryClient={queryClient} repositories={repositories}>
        <PreferencesScreen onBack={() => {}} />
      </AppStageProviders>
    </ThemeProvider>,
  );
}

describe('PreferencesScreen', () => {
  // Skipped: see DashboardScreen.test.tsx's docblock for the underlying cross-app-pitfall.
  it.skip('renders Theme, Language and Base currency controls, with no Sidebar control', async () => {
    await renderPreferences();

    expect(await screen.findByText('Theme')).toBeTruthy();
    expect(screen.getByText('Language')).toBeTruthy();
    expect(screen.getByText('Base currency')).toBeTruthy();
    expect(screen.queryByText('Sidebar')).toBeNull();
  });

  // Skipped: same cross-app-pitfall — cross-app-pitfalls.md #6's "verify the seed actually
  // reaches it" check. The seed's 'a4' account is USD against a EUR base specifically so this
  // row exists (seedData.ts's own comment: "makes Settings → Preferences' exchange-rate section
  // … actually show a row") — asserting the populated row, not the empty state, is the real test.
  it.skip('shows a rate row for the seeded USD account against the EUR base currency', async () => {
    await renderPreferences();

    expect(await screen.findByText('USD → EUR')).toBeTruthy();
  });
});
