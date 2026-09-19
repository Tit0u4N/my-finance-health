// @repo/app-core — level 2.
// Pure — no React, no I/O. useWorkspaceBootstrap.ts drives this against the injected
// WorkspaceOpener; every side effect (calling the opener, persisting the recent-workspaces
// list) lives there, not here.

import type { BootstrapEvent, BootstrapState, WorkspaceOpenStep, WorkspaceRef } from './bootstrapState';

function stepToState(ref: WorkspaceRef, step: WorkspaceOpenStep): BootstrapState {
  switch (step.kind) {
    case 'needs-unlock':
      return { kind: 'needs-unlock', ref };
    case 'migrating':
      return { kind: 'migrating', ref };
    case 'replaying':
      return { kind: 'replaying', ref };
    case 'ready':
      return { kind: 'ready', ref, repositories: step.repositories };
    default:
      return step satisfies never;
  }
}

// `state` is unused: every event fully determines the next state on its own. The parameter stays
// to match the (state, action) => state signature useReducer requires.
export function bootstrapReducer(_state: BootstrapState, event: BootstrapEvent): BootstrapState {
  switch (event.type) {
    case 'recent-loaded':
      return { kind: 'needs-designation', recent: event.recent };
    case 'step-resolved':
      return stepToState(event.ref, event.step);
    case 'failed':
      return { kind: 'failed', error: event.error };
    case 'locked':
      return { kind: 'needs-unlock', ref: event.ref };
    case 'reset':
      return { kind: 'idle' };
    default:
      return event satisfies never;
  }
}

export const INITIAL_BOOTSTRAP_STATE: BootstrapState = { kind: 'idle' };
