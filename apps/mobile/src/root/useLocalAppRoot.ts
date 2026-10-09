// ViewModel behind LocalAppRoot.tsx — mobile's counterpart of apps/desktop's useLocalApp.ts, minus
// the router (Expo Router owns navigation). It composes the real platform, the local workspace
// opener and the bootstrap-stage state machine (start-roadmap.md §9's two-stage split).
//
// `opener` is rebuilt every render rather than memoized, and the session is handed off through
// state (`onSessionOpen: setSession`) rather than a ref — same reasoning as desktop's hook: a ref
// written from a callback built during render is what React Compiler flags as unsafe.

import { useWorkspaceBootstrap } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import { createLocalWorkspaceOpener, type LocalWorkspaceSession } from '@repo/data/workspace/localWorkspaceOpener';
import type { Platform } from '@repo/platform/platform';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocalWorkspaceSession } from './useLocalWorkspaceSession';

export type LocalBootstrapProgress = 'migrating' | 'replaying' | null;

export function useLocalAppRoot(platform: Platform) {
  const [progress, setProgress] = useState<LocalBootstrapProgress>(null);
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

  // One QueryClient for the app's lifetime, emptied whenever a session ends: the next workspace
  // (or the same one, re-unlocked) must never paint the previous one's cached rows.
  const [queryClient] = useState(() => new QueryClient());

  // Fire-and-forget from the caller's side: once `state.kind` leaves `ready`, whatever pressed
  // the button is unmounted, so there is nothing left to show a pending state on.
  const closeSession = async (): Promise<void> => {
    await session?.close();
    setSession(null);
    queryClient.clear();
  };

  const lock = (): void => {
    if (bootstrap.state.kind !== 'ready') {
      return;
    }
    const { ref } = bootstrap.state;
    void closeSession().then(() => bootstrap.lock(ref));
  };

  const switchWorkspace = (): void => {
    void closeSession().then(() => bootstrap.chooseAnother());
  };

  return { bootstrap, progress, queryClient, session, lock, switchWorkspace };
}
