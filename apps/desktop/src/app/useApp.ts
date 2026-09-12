import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import type { Platform } from '@repo/platform/platform';
import { createLocalStorageKeyValueStore } from '@repo/platform-tauri/services/keyValueStore';
import { createAppRouter } from '@repo/router/createAppRouter';
import { routeTree } from '@repo/routes/routeTree';
import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';

function createWorkspace() {
  if (import.meta.env.VITE_STORAGE_MODE === 'classic') {
    throw new Error('VITE_STORAGE_MODE=classic: real workspace bootstrap is not wired up yet, use inMemory');
  }
  const { platform, repositories } = createMockWorkspace();
  // The mock platform's keyValueStore is an in-memory Map (packages/platform/src/fakePlatform.ts)
  // and its locale is hard-coded 'en-US' — both fine for shared-package tests, wrong for a real
  // window. Override just those two with the real adapter and the window's own locale; every
  // other fake service (clock, random, fileSystem, sqlDriver) is still correct for the mock
  // workspace this app boots against.
  const realPlatform: Platform = {
    ...platform,
    keyValueStore: createLocalStorageKeyValueStore(window.localStorage),
    localization: { locale: () => navigator.language },
  };
  return { platform: realPlatform, repositories };
}

export function useApp() {
  const [{ platform, repositories }] = useState(createWorkspace);
  const [queryClient] = useState(() => new QueryClient());
  const [router] = useState(() => createAppRouter({ routeTree, context: { queryClient, repositories } }));

  return { platform, repositories, queryClient, router };
}
