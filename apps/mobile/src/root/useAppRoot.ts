// ViewModel behind AppRoot.tsx. Only ever constructed once (`useState` initializer): switching
// workspace is a full unmount/remount elsewhere in the tree, never an in-place mutation of this
// hook's state (docs/start-roadmap.md §9).

import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Builds the in-memory fixture workspace apps/desktop's own mock branch already boots against
 * (App.tsx's `MockApp`) — same repositories, same fake platform. Nothing here is mobile-specific
 * yet: `@repo/platform-expo` is still a placeholder (no real SQLite/file-system adapter), so
 * there's no real adapter to override the fake platform's key-value store or localization with,
 * unlike apps/desktop's `createWorkspace`. Revisit once that package lands.
 */
function createWorkspace() {
  return createMockWorkspace();
}

export function useAppRoot() {
  const [{ platform, repositories }] = useState(createWorkspace);
  const [queryClient] = useState(() => new QueryClient());

  return { platform, repositories, queryClient };
}
