// The desktop app's local-mode entry point: composes the real Tauri platform, the local
// workspace opener, and the bootstrap-stage state machine (start-roadmap.md §9's two-stage
// split). Router/queryClient are built once a workspace reaches `ready`, mirroring useApp.ts's
// mock-workspace wiring but gated behind the real bootstrap sequence instead of a synchronous mock.
//
// `onProgress` is a side channel, not a `BootstrapState` transition: `unlock()`/`create()` each
// resolve to exactly one `WorkspaceOpenStep`, so the `migrating`/`replaying` states the port
// defines are unreachable through the reducer as designed (see localWorkspaceOpener.ts's
// docblock) — this hook surfaces them as a label on the spinner instead, purely cosmetic.
//
// `opener` is rebuilt every render rather than `useMemo`d: nothing downstream depends on its
// referential identity (useWorkspaceBootstrap's own effect keys off `platform.keyValueStore`,
// not the opener), and a session is handed off through state (`onSessionOpen: setSession`)
// instead of a ref — a ref written from a callback built during render is exactly what React
// Compiler flags as unsafe, even though the callback here only ever runs later, from a user
// action.

import { useWorkspaceBootstrap } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import { createLocalWorkspaceOpener, type LocalWorkspaceSession } from '@repo/data/workspace/localWorkspaceOpener';
import type { Platform } from '@repo/platform/platform';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import { createAppRouter } from '@repo/router/createAppRouter';
import { routeTree } from '@repo/routes/routeTree';
import { QueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useBiometricEnrollment } from './useBiometricEnrollment';
import { useLocalWorkspaceSession } from './useLocalWorkspaceSession';

// `platform` is created by the caller (LocalApp) and passed in, not built here: it must exist
// one component higher than this hook, wrapped in `PlatformProvider`, since `useWorkspaceBootstrap`
// below reads `usePlatform()` from context — a provider rendered by *this same* component's JSX
// (as BootstrapStageProviders/AppStageProviders are) is a descendant, not an ancestor, of the hook
// call, so it can't satisfy it.
export function useLocalApp(platform: Platform) {
  const [progress, setProgress] = useState<'migrating' | 'replaying' | null>(null);
  const [session, setSession] = useState<LocalWorkspaceSession | null>(null);

  const opener = createLocalWorkspaceOpener({
    fileSystem: platform.fileSystem as FileSystemService,
    sqlDriver: platform.sqlDriver as SqlDriver,
    keyValueStore: platform.keyValueStore,
    clock: platform.clock,
    random: platform.random,
    onProgress: setProgress,
    onSessionOpen: setSession,
  });

  const bootstrap = useWorkspaceBootstrap({ opener });
  useLocalWorkspaceSession(session);
  const { track: onBiometricIntent } = useBiometricEnrollment(bootstrap.state, platform.biometricUnlock);

  // Closes the real session (releases the occupancy lock, closes the SQL connection) before
  // flipping the bootstrap state machine back to `needs-unlock` for the same ref — mirrors
  // `useLocalWorkspaceSession`'s own window-close handler, just triggered by the user instead of
  // the OS. Fire-and-forget from the caller's perspective: `state.kind` changing away from
  // `ready` unmounts whatever button called this, so there's nothing left to show a pending state.
  const lock = (): void => {
    if (bootstrap.state.kind !== 'ready') {
      return;
    }
    const { ref } = bootstrap.state;
    void session?.close().then(() => {
      setSession(null);
      bootstrap.lock(ref);
    });
  };

  const [queryClient] = useState(() => new QueryClient());
  // Memoized (unlike `opener` above): the router must stay the same instance across renders once
  // built, or TanStack Router treats every render as a fresh mount. `bootstrap.state` only
  // changes reference when the bootstrap sequence actually advances, so this recomputes once —
  // when `ready` is first reached — and never again for the lifetime of the workspace.
  const router = useMemo(() => {
    if (bootstrap.state.kind !== 'ready') {
      return null;
    }
    return createAppRouter({ routeTree, context: { queryClient, repositories: bootstrap.state.repositories } });
  }, [bootstrap.state, queryClient]);

  return { platform, bootstrap, progress, queryClient, router, lock, onBiometricIntent };
}
