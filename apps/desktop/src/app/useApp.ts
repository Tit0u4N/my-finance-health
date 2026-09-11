import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import { createAppRouter } from '@repo/router/createAppRouter';
import { routeTree } from '@repo/routes/routeTree';
import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';

function createWorkspace() {
  if (import.meta.env.VITE_STORAGE_MODE === 'classic') {
    throw new Error('VITE_STORAGE_MODE=classic: real workspace bootstrap is not wired up yet, use inMemory');
  }
  return createMockWorkspace();
}

export function useApp() {
  const [{ platform, repositories }] = useState(createWorkspace);
  const [queryClient] = useState(() => new QueryClient());
  const [router] = useState(() => createAppRouter({ routeTree, context: { queryClient, repositories } }));

  return { platform, repositories, queryClient, router };
}
