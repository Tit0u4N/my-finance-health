import type { UseWorkspaceBootstrapResult } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { DomainError } from '@repo/domain/primitives/errors';
import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useBiometricEnrollment } from './useBiometricEnrollment';

const ref: WorkspaceRef = { mode: 'local', id: 'workspace-1', path: '/w1.mfhdb', label: 'My workspace' };
const readyState: UseWorkspaceBootstrapResult['state'] = {
  kind: 'ready',
  ref,
  repositories: {} as RepositorySet,
};
const needsUnlockState: UseWorkspaceBootstrapResult['state'] = { kind: 'needs-unlock', ref };
const fakeError: DomainError = { kind: 'validation', message: 'wrong passphrase' };
const failedState: UseWorkspaceBootstrapResult['state'] = { kind: 'failed', error: fakeError };

function createFakeBiometricUnlock(): BiometricUnlockService {
  return {
    status: vi.fn(() => Promise.resolve({ isAvailable: true, label: 'Touch ID' })),
    has: vi.fn(() => Promise.resolve(false)),
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
  };
}

function setup(biometricUnlock: BiometricUnlockService) {
  return renderHook(({ state }) => useBiometricEnrollment(state, biometricUnlock), {
    initialProps: { state: needsUnlockState },
  });
}

describe('useBiometricEnrollment — store/forget policy', () => {
  it('stores the passphrase only once the workspace actually reaches ready', async () => {
    const biometricUnlock = createFakeBiometricUnlock();
    const { result, rerender } = setup(biometricUnlock);

    act(() =>
      result.current.track({
        key: 'workspace-1',
        secret: 'my-passphrase',
        remember: true,
        sourcedFromBiometric: false,
      }),
    );
    expect(biometricUnlock.set).not.toHaveBeenCalled();

    rerender({ state: readyState });

    await waitFor(() => expect(biometricUnlock.set).toHaveBeenCalledWith('workspace-1', 'my-passphrase'));
  });

  it('removes any existing entry before re-adding, so the plugin never updates in place', async () => {
    const calls: string[] = [];
    const biometricUnlock = createFakeBiometricUnlock();
    vi.mocked(biometricUnlock.remove).mockImplementation(() => {
      calls.push('remove');
      return Promise.resolve();
    });
    vi.mocked(biometricUnlock.set).mockImplementation(() => {
      calls.push('set');
      return Promise.resolve();
    });
    const { result, rerender } = setup(biometricUnlock);

    act(() =>
      result.current.track({
        key: 'workspace-1',
        secret: 'my-passphrase',
        remember: true,
        sourcedFromBiometric: false,
      }),
    );
    rerender({ state: readyState });

    await waitFor(() => expect(calls).toEqual(['remove', 'set']));
  });

  it('writes nothing after a successful biometric-sourced unlock — the entry already holds that secret', async () => {
    const biometricUnlock = createFakeBiometricUnlock();
    const { result, rerender } = setup(biometricUnlock);

    act(() =>
      result.current.track({ key: 'workspace-1', secret: 'stored-secret', remember: true, sourcedFromBiometric: true }),
    );
    rerender({ state: readyState });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(biometricUnlock.set).not.toHaveBeenCalled();
    expect(biometricUnlock.remove).not.toHaveBeenCalled();
  });

  it('removes the entry instead when the checkbox was unchecked', async () => {
    const biometricUnlock = createFakeBiometricUnlock();
    const { result, rerender } = setup(biometricUnlock);

    act(() =>
      result.current.track({
        key: 'workspace-1',
        secret: 'my-passphrase',
        remember: false,
        sourcedFromBiometric: false,
      }),
    );
    rerender({ state: readyState });

    await waitFor(() => expect(biometricUnlock.remove).toHaveBeenCalledWith('workspace-1'));
    expect(biometricUnlock.set).not.toHaveBeenCalled();
  });

  it('forgets a biometric-sourced entry when the unlock it released then fails', async () => {
    const biometricUnlock = createFakeBiometricUnlock();
    const { result, rerender } = setup(biometricUnlock);

    act(() =>
      result.current.track({ key: 'workspace-1', secret: 'stale-secret', remember: true, sourcedFromBiometric: true }),
    );
    rerender({ state: failedState });

    await waitFor(() => expect(biometricUnlock.remove).toHaveBeenCalledWith('workspace-1'));
  });

  it('leaves a typed, non-biometric secret alone after a failure', async () => {
    const biometricUnlock = createFakeBiometricUnlock();
    const { result, rerender } = setup(biometricUnlock);

    act(() =>
      result.current.track({
        key: 'workspace-1',
        secret: 'typed-wrong-secret',
        remember: true,
        sourcedFromBiometric: false,
      }),
    );
    rerender({ state: failedState });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(biometricUnlock.remove).not.toHaveBeenCalled();
    expect(biometricUnlock.set).not.toHaveBeenCalled();
  });
});
