// ViewModel behind AppRoot.tsx. Only ever constructed once (`useState` initializer): switching
// workspace is a full unmount/remount elsewhere in the tree, never an in-place mutation of this
// hook's state (docs/start-roadmap.md §9).

import { createMockWorkspace } from '@repo/data/mock/createMockWorkspace';
import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';

// Every capability here is honestly false: `@repo/platform-expo` is still a placeholder, so
// mobile has no real file system, no secret vault, no biometric unlock and no SQLCipher driver
// today. Without this override `createFakePlatform`'s all-`true` default would make Settings →
// Data render as if file export/import worked (cross-app-pitfalls.md #3's "fake service must be
// overridden wherever its default would be visibly wrong" — capabilities are a third such
// service, alongside keyValueStore and localization below).
const MOBILE_CAPABILITIES = {
  canWriteFile: false,
  canPickFile: false,
  canResumeLocation: false,
  hasSecretVault: false,
  hasBiometricUnlock: false,
  hasEncryptedSqlDriver: false,
  canControlWindow: false,
  canUpdate: false,
} as const;

/**
 * Builds the in-memory fixture workspace apps/desktop's own mock branch already boots against
 * (App.tsx's `MockApp`) — same repositories, same fake platform, with mobile's own honest
 * capability set layered on. `@repo/platform-expo` is still a placeholder (no real SQLite/
 * file-system adapter), so there's no real adapter yet to back `keyValueStore` with persistence
 * or `localization` with the device's own locale, unlike apps/desktop's `createWorkspace` —
 * preferences (theme, language, amounts-hidden) survive the session but reset on cold start until
 * that package lands. Revisit this whole function once it does.
 */
function createWorkspace() {
  return createMockWorkspace({ capabilities: MOBILE_CAPABILITIES });
}

export function useAppRoot() {
  const [{ platform, repositories }] = useState(createWorkspace);
  const [queryClient] = useState(() => new QueryClient());

  return { platform, repositories, queryClient };
}
