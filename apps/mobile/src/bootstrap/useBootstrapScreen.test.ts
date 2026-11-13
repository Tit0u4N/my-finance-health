import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { notFoundError } from '@repo/domain/primitives/errors';
import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import { describe, expect, it } from 'vitest';
import { progressLabel, viewForState, withSyncedWorkspaces } from './useBootstrapScreen';

// Echoes the key: the copy itself is the i18n package's concern, this file tests which key is chosen.
// biome-ignore lint/suspicious/noExplicitAny: a key-echoing stub is looser than the hook's bound `t`.
const t = ((key: string) => key) as any;

const ref: WorkspaceRef = { mode: 'local', id: 'w1', path: 'MyFinanceHealth/workspaces/a/Home.mfhdb', label: 'Home' };

describe('viewForState', () => {
  it('shows the workspace list, with the recent workspaces, once nothing is designated', () => {
    expect(viewForState({ kind: 'needs-designation', recent: [ref] }, null, t)).toEqual({
      kind: 'picker',
      recent: [ref],
      synced: [],
    });
  });

  it('asks for the passphrase of the workspace awaiting unlock', () => {
    expect(viewForState({ kind: 'needs-unlock', ref }, null, t)).toEqual({ kind: 'unlock', workspaceRef: ref });
  });

  it('turns a domain error into readable copy', () => {
    const view = viewForState({ kind: 'failed', error: notFoundError('LocalWorkspace', 'x') }, null, t);

    expect(view).toEqual({ kind: 'error', message: 'bootstrap:error.notFound' });
  });

  it('labels the spinner with the cosmetic progress step while a workspace opens', () => {
    expect(viewForState({ kind: 'ready', ref, repositories: {} as RepositorySet }, 'replaying', t)).toEqual({
      kind: 'loading',
      label: 'bootstrap:progress.replaying',
    });
    expect(viewForState({ kind: 'idle' }, null, t)).toEqual({ kind: 'loading', label: 'bootstrap:progress.loading' });
  });
});

describe('progressLabel', () => {
  it('has a label for every step, and a neutral one when there is none', () => {
    expect(progressLabel('migrating', t)).toBe('bootstrap:progress.migrating');
    expect(progressLabel('replaying', t)).toBe('bootstrap:progress.replaying');
    expect(progressLabel(null, t)).toBe('bootstrap:progress.opening');
  });
});

describe('withSyncedWorkspaces', () => {
  const cloudRef: WorkspaceRef = {
    mode: 'local',
    id: 'cloud:/Shared/Shared.mfhdb',
    path: 'cloud:/Shared/Shared.mfhdb',
    label: 'Shared',
  };
  const recentCloudRef: WorkspaceRef = {
    ...cloudRef,
    id: 'cloud:/Home/Home.mfhdb',
    path: 'cloud:/Home/Home.mfhdb',
    label: 'Home',
  };

  it('lists synced workspaces the recent list does not already show', () => {
    const view = withSyncedWorkspaces({ kind: 'picker', recent: [recentCloudRef], synced: [] }, [
      cloudRef,
      recentCloudRef,
    ]);

    expect(view).toEqual({ kind: 'picker', recent: [recentCloudRef], synced: [cloudRef] });
  });

  it('leaves every other view untouched', () => {
    const view = { kind: 'unlock', workspaceRef: ref } as const;

    expect(withSyncedWorkspaces(view, [cloudRef])).toBe(view);
  });
});
