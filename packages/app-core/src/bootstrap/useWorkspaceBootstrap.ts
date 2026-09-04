// @repo/app-core — level 2.
// Drives bootstrapReducer against the injected WorkspaceOpener and the recent-workspaces list.
// Entirely capability-driven: no platform-name check anywhere in this hook, only calls against
// the injected platform contract and opener (app-core-inventory.md §2).
//
// Onboarding steps 1–2 (seed accounts, seed categories) are deliberately NOT part of this hook:
// once a workspace is `ready`, seeding is two ordinary batched `create` calls through the normal
// mutation hooks below, not a bootstrap special case (app-core-inventory.md §2's "judgment call").

import { listRecentWorkspaces, rememberWorkspace } from '@repo/data/workspace/recentWorkspaces';
import type { CreateWorkspaceInput, WorkspaceOpener } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { DomainError } from '@repo/domain/primitives/errors';
import { isErr } from '@repo/domain/primitives/result';
import type { KeyValueStore } from '@repo/platform/services/keyValueStore';
import { useEffect, useReducer } from 'react';
import { usePlatform } from '../providers/usePlatform';
import { bootstrapReducer, INITIAL_BOOTSTRAP_STATE } from './bootstrapReducer';
import type { BootstrapEvent, BootstrapState } from './bootstrapState';

export type UseWorkspaceBootstrapDeps = {
  readonly opener: WorkspaceOpener;
};

export type UseWorkspaceBootstrapResult = {
  readonly state: BootstrapState;
  /** Resumes a previously-designated workspace (e.g. the user picked one from the recent list). */
  readonly open: (ref: WorkspaceRef) => Promise<void>;
  /** Supplies the passphrase once `state.kind === 'needs-unlock'`. */
  readonly unlock: (ref: WorkspaceRef, secret: string) => Promise<void>;
  /** Designates and creates a brand-new workspace. */
  readonly create: (ref: WorkspaceRef, input: CreateWorkspaceInput) => Promise<void>;
};

async function resolve(
  dispatch: (event: BootstrapEvent) => void,
  keyValueStore: KeyValueStore,
  ref: WorkspaceRef,
  pending: ReturnType<WorkspaceOpener['open']>,
): Promise<void> {
  const result = await pending;
  if (isErr(result)) {
    dispatch({ type: 'failed', error: result.error satisfies DomainError });
    return;
  }
  dispatch({ type: 'step-resolved', ref, step: result.value });
  if (result.value.kind === 'ready') {
    await rememberWorkspace(keyValueStore, ref);
  }
}

export function useWorkspaceBootstrap({ opener }: UseWorkspaceBootstrapDeps): UseWorkspaceBootstrapResult {
  const platform = usePlatform();
  const [state, dispatch] = useReducer(bootstrapReducer, INITIAL_BOOTSTRAP_STATE);

  useEffect(() => {
    let cancelled = false;
    void listRecentWorkspaces(platform.keyValueStore).then((recent) => {
      if (!cancelled) {
        dispatch({ type: 'recent-loaded', recent });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [platform.keyValueStore]);

  const open = (ref: WorkspaceRef): Promise<void> => resolve(dispatch, platform.keyValueStore, ref, opener.open(ref));

  const unlock = (ref: WorkspaceRef, secret: string): Promise<void> =>
    resolve(dispatch, platform.keyValueStore, ref, opener.unlock(ref, secret));

  const create = (ref: WorkspaceRef, input: CreateWorkspaceInput): Promise<void> =>
    resolve(dispatch, platform.keyValueStore, ref, opener.create(ref, input));

  return { state, open, unlock, create };
}
