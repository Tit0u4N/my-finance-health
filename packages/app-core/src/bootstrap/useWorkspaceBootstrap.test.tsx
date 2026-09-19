import type { CreateWorkspaceInput, WorkspaceOpener, WorkspaceOpenStep } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { DomainError } from '@repo/domain/primitives/errors';
import { err, ok, type Result } from '@repo/domain/primitives/result';
import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import { createFakePlatform } from '@repo/platform/fakePlatform';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from '../providers/PlatformProvider';
import { useWorkspaceBootstrap } from './useWorkspaceBootstrap';

const ref: WorkspaceRef = { mode: 'online', id: 'w1', apiBaseUrl: 'https://api.test', label: 'My workspace' };
const fakeRepositories = {} as RepositorySet;

function createFakeOpener(overrides: Partial<WorkspaceOpener> = {}): WorkspaceOpener {
  return {
    open: vi.fn(() => Promise.resolve(ok<WorkspaceOpenStep>({ kind: 'ready', repositories: fakeRepositories }))),
    unlock: vi.fn(() => Promise.resolve(ok<WorkspaceOpenStep>({ kind: 'ready', repositories: fakeRepositories }))),
    create: vi.fn((_ref: WorkspaceRef, _input: CreateWorkspaceInput) =>
      Promise.resolve(ok<WorkspaceOpenStep>({ kind: 'ready', repositories: fakeRepositories })),
    ),
    ...overrides,
  };
}

function renderBootstrap(opener: WorkspaceOpener) {
  const platform = createFakePlatform();
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <PlatformProvider platform={platform}>{children}</PlatformProvider>
  );
  const rendered = renderHook(() => useWorkspaceBootstrap({ opener }), { wrapper });
  return { platform, ...rendered };
}

describe('useWorkspaceBootstrap', () => {
  it('starts idle, then reaches needs-designation once the (empty) recent list loads', async () => {
    const { result } = renderBootstrap(createFakeOpener());

    expect(result.current.state.kind).toBe('idle');
    await waitFor(() => expect(result.current.state.kind).toBe('needs-designation'));
    expect(result.current.state).toEqual({ kind: 'needs-designation', recent: [] });
  });

  it('open() carries a needs-unlock step through to state', async () => {
    const opener = createFakeOpener({
      open: vi.fn(() => Promise.resolve(ok<WorkspaceOpenStep>({ kind: 'needs-unlock' }))),
    });
    const { result } = renderBootstrap(opener);
    await waitFor(() => expect(result.current.state.kind).toBe('needs-designation'));

    await result.current.open(ref);

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'needs-unlock', ref }));
  });

  it('unlock() reaches ready and remembers the workspace', async () => {
    const opener = createFakeOpener();
    const { result, platform } = renderBootstrap(opener);
    await waitFor(() => expect(result.current.state.kind).toBe('needs-designation'));

    await result.current.unlock(ref, 'my-passphrase');

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'ready', ref, repositories: fakeRepositories }));
    const recent = await platform.keyValueStore.get('recent-workspaces');
    expect(recent).not.toBeNull();
    expect(JSON.parse(recent ?? '[]')).toEqual([ref]);
  });

  it('create() reaches ready without ever calling open or unlock', async () => {
    const opener = createFakeOpener();
    const { result } = renderBootstrap(opener);
    await waitFor(() => expect(result.current.state.kind).toBe('needs-designation'));

    await result.current.create(ref, { timezone: 'Europe/Paris' as never, baseCurrency: 'EUR' });

    await waitFor(() => expect(result.current.state.kind).toBe('ready'));
    expect(opener.open).not.toHaveBeenCalled();
    expect(opener.unlock).not.toHaveBeenCalled();
  });

  it('lock() returns a ready workspace to needs-unlock for the same ref', async () => {
    const opener = createFakeOpener();
    const { result } = renderBootstrap(opener);
    await waitFor(() => expect(result.current.state.kind).toBe('needs-designation'));

    await result.current.unlock(ref, 'my-passphrase');
    await waitFor(() => expect(result.current.state.kind).toBe('ready'));

    act(() => result.current.lock(ref));

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'needs-unlock', ref }));
  });

  it('a failed step moves state to failed, carrying the domain error', async () => {
    const error: DomainError = { kind: 'unauthorized', message: 'wrong passphrase' };
    const opener = createFakeOpener({
      unlock: vi.fn(() => Promise.resolve(err(error) as Result<WorkspaceOpenStep, DomainError>)),
    });
    const { result } = renderBootstrap(opener);
    await waitFor(() => expect(result.current.state.kind).toBe('needs-designation'));

    await result.current.unlock(ref, 'wrong');

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'failed', error }));
  });
});
