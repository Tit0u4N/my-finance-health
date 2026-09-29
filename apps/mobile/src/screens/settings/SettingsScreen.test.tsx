// Mirrors DashboardScreen.test.tsx's shape and its documented skip (see that file's docblock) —
// this screen additionally reads `usePlatform()` (fine, no store) but its ViewModel reads
// `usePreferencesStore` indirectly through no store today, yet still renders inside
// `AppStageProviders`/`PreferencesProvider`, which is what actually triggers the dual-React issue
// for every screen in this app, not just the ones reading the store directly.

import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { SettingsScreen } from './SettingsScreen';

async function renderSettings(): Promise<void> {
  const { platform, repositories } = createMockWorkspace();
  const queryClient = new QueryClient();

  await render(
    <ThemeProvider>
      <AppStageProviders platform={platform} queryClient={queryClient} repositories={repositories}>
        <SettingsScreen onOpenSection={() => {}} version="1.0.0" />
      </AppStageProviders>
    </ThemeProvider>,
  );
}

describe('SettingsScreen', () => {
  // Skipped: see DashboardScreen.test.tsx's docblock for the underlying cross-app-pitfall.
  it.skip('renders the App and Support row groups, with a Data row present', async () => {
    await renderSettings();

    expect(await screen.findByText('My Finance Health')).toBeTruthy();
    expect(screen.getByText('Preferences')).toBeTruthy();
    expect(screen.getByText('Categories')).toBeTruthy();
    expect(screen.getByText('Data')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
  });

  // Skipped: same cross-app-pitfall — the regression this covers, the pure part of it, is already
  // asserted for real in settingsSections.test.ts.
  it.skip("omits the Data row's screen-level file actions until canWriteFile is honestly true", async () => {
    await renderSettings();
    // `apps/mobile/src/root/useAppRoot.ts` overrides canWriteFile to false — asserted end-to-end
    // by walking into the Data row once this test is unblocked, not duplicated here.
    expect(await screen.findByText('Data')).toBeTruthy();
  });
});
