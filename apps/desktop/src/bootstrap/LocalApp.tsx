import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { BootstrapStageProviders } from '@repo/app-core/providers/BootstrapStageProviders';
import { PlatformProvider } from '@repo/app-core/providers/PlatformProvider';
import type { Platform } from '@repo/platform/platform';
import { RouterProvider } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useThemeSync } from '../app/useThemeSync';
import { createDesktopPlatform } from '../platform/createDesktopPlatform';
import { BootstrapScreen } from './BootstrapScreen';
import { useLocalApp } from './useLocalApp';

export function LocalApp(): ReactElement {
  const [platform] = useState<Platform>(() => createDesktopPlatform());

  // `PlatformProvider` here, not just the ones nested inside BootstrapStageProviders/
  // AppStageProviders below: `useLocalApp` calls `useWorkspaceBootstrap`, which reads
  // `usePlatform()` from context, so the provider must be an ancestor of that hook call,
  // not a descendant produced by this same component's returned JSX.
  return (
    <PlatformProvider platform={platform}>
      <LocalAppBootstrap platform={platform} />
    </PlatformProvider>
  );
}

function LocalAppBootstrap({ platform }: { readonly platform: Platform }): ReactElement {
  const { bootstrap, progress, queryClient, router } = useLocalApp(platform);

  if (bootstrap.state.kind === 'ready' && router) {
    return (
      <AppStageProviders platform={platform} repositories={bootstrap.state.repositories} queryClient={queryClient}>
        <ThemedRouter router={router} />
      </AppStageProviders>
    );
  }

  return (
    <BootstrapStageProviders platform={platform}>
      <BootstrapScreen platform={platform} bootstrap={bootstrap} progress={progress} />
    </BootstrapStageProviders>
  );
}

// Split out so `useThemeSync` (it reads the preferences store) runs inside AppStageProviders,
// not in LocalApp itself, which is what constructs those providers in the first place — same
// shape as apps/desktop/src/app/App.tsx's own ThemedRouter.
function ThemedRouter({
  router,
}: {
  readonly router: NonNullable<ReturnType<typeof useLocalApp>['router']>;
}): ReactElement {
  useThemeSync();
  return <RouterProvider router={router} />;
}
