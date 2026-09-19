// @repo/app-core — level 2.
// `null` means "this host has no way to return to the unlock screen" (online mode, or a host
// that hasn't wired a bootstrap session) — the same optional-capability shape as
// `PlatformCapabilities`, but scoped to the current session rather than the platform.

import { createContext } from 'react';

export const WorkspaceLockContext = createContext<(() => void) | null>(null);
