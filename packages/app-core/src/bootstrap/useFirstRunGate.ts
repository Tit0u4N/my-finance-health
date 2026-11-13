// @repo/app-core — level 2.
// Remembers that the workspace now open was created in this run, so the app can show the starter
// categories step once before the main screens (audit P1). Tracked by workspace ref, not a bare
// boolean: a `create` that fails, or a later unlock of a different workspace, must never show it.
// Locking, switching or finishing clears it, and a process restart forgets it — the empty-state
// in the transaction sheet is the safety net for a user who never saw (or skipped) the step.

import { useState } from 'react';
import type { UseWorkspaceBootstrapResult } from './useWorkspaceBootstrap';

export type FirstRunGate = {
  /** `bootstrap` with `create` wrapped to arm the gate; everything else is untouched. */
  readonly bootstrap: UseWorkspaceBootstrapResult;
  /** True while the open workspace is the one created in this run and the step is not done. */
  readonly isStarterPending: boolean;
  readonly dismissStarter: () => void;
};

export function useFirstRunGate(bootstrap: UseWorkspaceBootstrapResult): FirstRunGate {
  const [createdId, setCreatedId] = useState<string | null>(null);

  const wrapped: UseWorkspaceBootstrapResult = {
    ...bootstrap,
    chooseAnother: () => {
      setCreatedId(null);
      return bootstrap.chooseAnother();
    },
    create: (ref, input) => {
      setCreatedId(ref.id);
      return bootstrap.create(ref, input);
    },
    lock: (ref) => {
      setCreatedId(null);
      bootstrap.lock(ref);
    },
  };

  const isStarterPending =
    createdId !== null && bootstrap.state.kind === 'ready' && bootstrap.state.ref.id === createdId;

  return { bootstrap: wrapped, dismissStarter: () => setCreatedId(null), isStarterPending };
}
