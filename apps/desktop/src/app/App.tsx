import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { RouterProvider } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { LocalApp } from '../bootstrap/LocalApp';
import { useApp } from './useApp';
import { useThemeSync } from './useThemeSync';

// A module-level check rather than a branch inside a hook: MockApp and LocalApp each call their
// own hooks unconditionally, so no hook here is ever called conditionally.
const IS_LOCAL_MODE = import.meta.env.VITE_STORAGE_MODE === 'classic';

export function App(): ReactElement {
  return IS_LOCAL_MODE ? <LocalApp /> : <MockApp />;
}

function MockApp(): ReactElement {
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
