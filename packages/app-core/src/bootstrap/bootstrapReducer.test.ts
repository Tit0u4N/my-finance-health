import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import { describe, expect, it } from 'vitest';
import { bootstrapReducer, INITIAL_BOOTSTRAP_STATE } from './bootstrapReducer';
import type { BootstrapState, WorkspaceRef } from './bootstrapState';

const onlineRef: WorkspaceRef = { mode: 'online', id: 'w1', apiBaseUrl: 'https://api.test', label: 'My workspace' };
const localRef: WorkspaceRef = { mode: 'local', id: 'w2', path: '/tmp/x.sqlite', label: 'Local file' };
const fakeRepositories = {} as RepositorySet;

describe('bootstrapReducer', () => {
  it('starts idle', () => {
    expect(INITIAL_BOOTSTRAP_STATE).toEqual({ kind: 'idle' });
  });

  it('recent-loaded moves idle to needs-designation, carrying the recent list', () => {
    const next = bootstrapReducer(INITIAL_BOOTSTRAP_STATE, { type: 'recent-loaded', recent: [onlineRef, localRef] });
    expect(next).toEqual({ kind: 'needs-designation', recent: [onlineRef, localRef] });
  });

  it('step-resolved with needs-unlock moves to needs-unlock, carrying the ref', () => {
    const state: BootstrapState = { kind: 'needs-designation', recent: [] };
    const next = bootstrapReducer(state, { type: 'step-resolved', ref: localRef, step: { kind: 'needs-unlock' } });
    expect(next).toEqual({ kind: 'needs-unlock', ref: localRef });
  });

  it('step-resolved with migrating moves to migrating', () => {
    const state: BootstrapState = { kind: 'needs-unlock', ref: localRef };
    const next = bootstrapReducer(state, { type: 'step-resolved', ref: localRef, step: { kind: 'migrating' } });
    expect(next).toEqual({ kind: 'migrating', ref: localRef });
  });

  it('step-resolved with replaying moves to replaying', () => {
    const state: BootstrapState = { kind: 'migrating', ref: localRef };
    const next = bootstrapReducer(state, { type: 'step-resolved', ref: localRef, step: { kind: 'replaying' } });
    expect(next).toEqual({ kind: 'replaying', ref: localRef });
  });

  it('step-resolved with ready carries the repositories through', () => {
    const state: BootstrapState = { kind: 'needs-designation', recent: [] };
    const next = bootstrapReducer(state, {
      type: 'step-resolved',
      ref: onlineRef,
      step: { kind: 'ready', repositories: fakeRepositories },
    });
    expect(next).toEqual({ kind: 'ready', ref: onlineRef, repositories: fakeRepositories });
  });

  it('failed moves to failed from any state, carrying the error', () => {
    const state: BootstrapState = { kind: 'needs-unlock', ref: localRef };
    const error = { kind: 'unauthorized' as const, message: 'wrong passphrase' };
    const next = bootstrapReducer(state, { type: 'failed', error });
    expect(next).toEqual({ kind: 'failed', error });
  });

  it('locked moves ready back to needs-unlock for the same ref', () => {
    const state: BootstrapState = { kind: 'ready', ref: localRef, repositories: fakeRepositories };
    expect(bootstrapReducer(state, { type: 'locked', ref: localRef })).toEqual({
      kind: 'needs-unlock',
      ref: localRef,
    });
  });

  it('reset always returns to idle', () => {
    const state: BootstrapState = { kind: 'ready', ref: onlineRef, repositories: fakeRepositories };
    expect(bootstrapReducer(state, { type: 'reset' })).toEqual({ kind: 'idle' });
  });
});
