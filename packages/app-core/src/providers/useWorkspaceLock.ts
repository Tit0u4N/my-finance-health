// @repo/app-core — level 2.
// Capability check, not a platform-name branch: `canLock` is false wherever `AppStageProviders`
// wasn't handed an `onLockWorkspace` (online mode, or a host with no bootstrap session at all).

import { useContext } from 'react';
import { WorkspaceLockContext } from './workspaceLockContext';

export type UseWorkspaceLockResult =
  | { readonly canLock: false }
  | { readonly canLock: true; readonly lock: () => void };

export function useWorkspaceLock(): UseWorkspaceLockResult {
  const lock = useContext(WorkspaceLockContext);
  return lock ? { canLock: true, lock } : { canLock: false };
}
