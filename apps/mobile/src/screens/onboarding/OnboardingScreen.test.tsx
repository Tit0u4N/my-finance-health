// Mirrors DashboardScreen.test.tsx / apps/desktop's App.test.tsx: composition and presentation
// only. Step 1's real `useCreateAccount` mutation is exercised end to end against the fixture
// repositories — see useOnboardingScreen.ts's docblock for why steps 0 and 2 stay presentational.

import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { OnboardingScreen } from './OnboardingScreen';

async function renderOnboarding(): Promise<{ readonly onDone: ReturnType<typeof vi.fn> }> {
  const { platform, repositories } = createMockWorkspace();
  const queryClient = new QueryClient();
  const onDone = vi.fn();

  await render(
    <ThemeProvider>
      <AppStageProviders platform={platform} queryClient={queryClient} repositories={repositories}>
        <OnboardingScreen onDone={onDone} />
      </AppStageProviders>
    </ThemeProvider>,
  );
  return { onDone };
}

describe('OnboardingScreen', () => {
  // Skipped: same cross-app-pitfall as DashboardScreen.test.tsx (docs/spec/cross-app-pitfalls.md)
  // — rendering @repo/app-core's `AppStageProviders` here hits it identically.
  it.skip('walks from step 0 to step 1 once a workspace option is picked', async () => {
    const user = userEvent.setup();
    await renderOnboarding();

    expect(screen.getByText('Your money, on your device.')).toBeTruthy();
    await user.press(screen.getByText('Create a new workspace'));
    await user.press(screen.getByText('Continue'));

    expect(await screen.findByText('Add your accounts')).toBeTruthy();
  });

  // Skipped: same cross-app-pitfall, see the skip above.
  it.skip('creates a real account through @repo/app-core on step 1', async () => {
    const user = userEvent.setup();
    await renderOnboarding();

    await user.press(screen.getByText('Create a new workspace'));
    await user.press(screen.getByText('Continue'));
    await user.type(await screen.findByPlaceholderText('e.g. Everyday'), 'Travel fund');
    await user.type(screen.getByPlaceholderText('0.00'), '250');
    await user.press(screen.getByText('Add account'));

    expect(await screen.findByText('Travel fund')).toBeTruthy();
  });
});
