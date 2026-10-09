// App root for the local (encrypted SQLite) storage mode — mirrors apps/desktop's LocalApp.tsx:
// the bootstrap stage (choose / create / import / unlock) runs with platform + translations only,
// and the app stage mounts once the workspace is verified ready. Switching workspace is a full
// unmount/remount of everything below `AppStageProviders`, never an in-place mutation
// (start-roadmap.md §9).

import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import { BootstrapStageProviders } from '@repo/app-core/providers/BootstrapStageProviders';
import { PlatformProvider } from '@repo/app-core/providers/PlatformProvider';
import type { Platform } from '@repo/platform/platform';
import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';
import { BootstrapScreen } from '@/bootstrap/BootstrapScreen';
import { createMobilePlatform } from '@/platform/createMobilePlatform';
import { ThemeModeSync } from '@/theme/ThemeModeSync';
import { useLocalAppRoot } from './useLocalAppRoot';
import { WorkspaceSessionContext } from './WorkspaceSessionContext';

type LocalAppRootProps = {
  readonly children: ReactNode;
};

export function LocalAppRoot({ children }: LocalAppRootProps): ReactElement {
  const [platform] = useState<Platform>(createMobilePlatform);

  // `PlatformProvider` here, one level above the component that calls `useWorkspaceBootstrap`:
  // that hook reads `usePlatform()`, so the provider must be an ancestor of the call, not a
  // descendant produced by the same component's returned JSX.
  return (
    <PlatformProvider platform={platform}>
      <LocalAppRootBody platform={platform}>{children}</LocalAppRootBody>
    </PlatformProvider>
  );
}

function LocalAppRootBody({
  platform,
  children,
}: {
  readonly platform: Platform;
  readonly children: ReactNode;
}): ReactElement {
  const { bootstrap, progress, queryClient, session, lock, switchWorkspace } = useLocalAppRoot(platform);

  if (bootstrap.state.kind === 'ready' && session) {
    return (
      <WorkspaceSessionContext.Provider
        value={{ databasePath: session.ref.path, onLock: lock, onSwitchWorkspace: switchWorkspace }}
      >
        <AppStageProviders
          platform={platform}
          repositories={bootstrap.state.repositories}
          queryClient={queryClient}
          onLockWorkspace={lock}
        >
          <ThemeModeSync />
          {children}
        </AppStageProviders>
      </WorkspaceSessionContext.Provider>
    );
  }

  return (
    <BootstrapStageProviders platform={platform}>
      <BootstrapScreen bootstrap={bootstrap} platform={platform} progress={progress} />
    </BootstrapStageProviders>
  );
}
