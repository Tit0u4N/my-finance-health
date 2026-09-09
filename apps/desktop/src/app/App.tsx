import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { RouterProvider } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { useApp } from './useApp';
import { useThemeSync } from './useThemeSync';

export function App(): ReactElement {
  const { platform, repositories, queryClient, router } = useApp();

  return (
    <AppStageProviders platform={platform} repositories={repositories} queryClient={queryClient}>
      <ThemedRouter router={router} />
    </AppStageProviders>
  );
}

// Split out so `useThemeSync` (it reads the preferences store) runs inside AppStageProviders,
// not in App itself, which is what constructs those providers in the first place.
function ThemedRouter({ router }: { readonly router: ReturnType<typeof useApp>['router'] }): ReactElement {
  useThemeSync();
  return <RouterProvider router={router} />;
}
