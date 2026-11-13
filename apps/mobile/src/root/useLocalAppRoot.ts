// ViewModel behind LocalAppRoot.tsx — mobile's counterpart of apps/desktop's useLocalApp.ts, minus
// the router (Expo Router owns navigation). It composes the real platform, the local workspace
// opener and the bootstrap-stage state machine (start-roadmap.md §9's two-stage split).
//
// `opener` is rebuilt every render rather than memoized, and the session is handed off through
// state (`onSessionOpen: setSession`) rather than a ref — same reasoning as desktop's hook: a ref
// written from a callback built during render is what React Compiler flags as unsafe.

import { useBiometricEnrollment } from '@repo/app-core/bootstrap/biometric/useBiometricEnrollment';
import { useFirstRunGate } from '@repo/app-core/bootstrap/useFirstRunGate';
import { useWorkspaceBootstrap } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import { JOURNAL_KEY_LENGTH } from '@repo/data/local/crypto/keys';
import { createLocalWorkspaceOpener, type LocalWorkspaceSession } from '@repo/data/workspace/localWorkspaceOpener';
import type { Platform } from '@repo/platform/platform';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deriveArgon2id } from '@/platform/argon2';
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
    deriveJournalKey: (secret, { salt, ...cost }) => deriveArgon2id(secret, salt, cost, JOURNAL_KEY_LENGTH),
    onProgress: setProgress,
    onSessionOpen: setSession,
  });

  const gate = useFirstRunGate(useWorkspaceBootstrap({ opener }));
  const { bootstrap } = gate;
  const [lockLost, setLockLost] = useState(false);
  // Lives here, not in the bootstrap screen: that screen unmounts the instant state turns `ready`,
  // before the entry could be written (useBiometricEnrollment.ts).
  const { track: onBiometricIntent } = useBiometricEnrollment(
    bootstrap.state,
    platform.capabilities.hasBiometricUnlock ? platform.biometricUnlock : undefined,
    (error) => {
      // biome-ignore lint/suspicious/noConsole: enrollment failing must not break the unlock that just succeeded, but it must not be silent either
      console.error('[biometricUnlock] enrollment failed', error);
    },
  );

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
    setLockLost(false);
    void closeSession().then(() => bootstrap.lock(ref));
  };

  // Another device took the occupancy lock over: stop writing, release, and ask for the passphrase
  // again with an explanation (audit P6). `session.ref` rather than `bootstrap.state`, which the
  // heartbeat's closure may have captured before the workspace was `ready`.
  useLocalWorkspaceSession(session, () => {
    if (session) {
      void closeSession().then(() => {
        setLockLost(true);
        bootstrap.lock(session.ref);
      });
    }
  });

  const switchWorkspace = (): void => {
    setLockLost(false);
    void closeSession().then(() => bootstrap.chooseAnother());
  };

  return {
    bootstrap,
    progress,
    queryClient,
    session,
    lock,
    switchWorkspace,
    lockLost,
    isStarterPending: gate.isStarterPending,
    dismissStarter: gate.dismissStarter,
    onBiometricIntent,
  };
}
