// @repo/app-core — level 2.
// The key the open workspace's biometric entry is stored under (its WorkspaceRef id —
// open-questions.md #23). `null` means "no per-workspace biometric entry can exist here" (online
// mode, the in-memory fixture) — the same session-scoped optional shape as WorkspaceLockContext.

import { createContext } from 'react';

export const WorkspaceBiometricContext = createContext<string | null>(null);
