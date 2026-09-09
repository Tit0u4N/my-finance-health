import { createAppRouter } from '@repo/router/createAppRouter';
import { routeTree } from '@repo/routes/routeTree';
import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createMockWorkspace } from '@/mock/createMockWorkspace';

export function useApp() {
  const [{ platform, repositories }] = useState(() => createMockWorkspace());
  const [queryClient] = useState(() => new QueryClient());
  const [router] = useState(() => createAppRouter({ routeTree, context: { queryClient, repositories } }));

  return { platform, repositories, queryClient, router };
}
