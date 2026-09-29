// Mirrors DashboardScreen.test.tsx's shape and its documented skip (see that file's docblock).

import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { CategoriesScreen } from './CategoriesScreen';

async function renderCategories(): Promise<void> {
  const { platform, repositories } = createMockWorkspace();
  const queryClient = new QueryClient();

  await render(
    <ThemeProvider>
      <AppStageProviders platform={platform} queryClient={queryClient} repositories={repositories}>
        <CategoriesScreen onBack={() => {}} />
      </AppStageProviders>
    </ThemeProvider>,
  );
}

describe('CategoriesScreen', () => {
  // Skipped: see DashboardScreen.test.tsx's docblock for the underlying cross-app-pitfall.
  it.skip('opens on the Expenses segment, listing the seeded expense categories', async () => {
    await renderCategories();

    // Seeded expense categories (createMockWorkspace.ts's mockSeed).
    expect(await screen.findByText('Rent')).toBeTruthy();
    expect(screen.getByText('Groceries')).toBeTruthy();
    // The seeded income categories should not be on screen yet.
    expect(screen.queryByText('Salary')).toBeNull();
  });
});
