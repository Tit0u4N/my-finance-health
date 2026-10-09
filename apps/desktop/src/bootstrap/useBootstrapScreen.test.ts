import type { UseWorkspaceBootstrapResult } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useBootstrapScreen } from './useBootstrapScreen';

const ref: WorkspaceRef = { mode: 'local', id: 'workspace-1', path: '/w1.mfhdb', label: 'My workspace' };

function createFakeBootstrap(): UseWorkspaceBootstrapResult {
  return {
    state: { kind: 'needs-unlock', ref },
    open: vi.fn(() => Promise.resolve()),
    unlock: vi.fn(() => Promise.resolve()),
    create: vi.fn(() => Promise.resolve()),
    lock: vi.fn(),
    chooseAnother: vi.fn(() => Promise.resolve()),
  };
}

describe('useBootstrapScreen — biometric intent reporting', () => {
  it('reports the remember choice and the secret source on unlock', async () => {
    const bootstrap = createFakeBootstrap();
    const onBiometricIntent = vi.fn();
    const { result } = renderHook(() => useBootstrapScreen(bootstrap, onBiometricIntent));

    act(() => result.current.unlock(ref, 'my-passphrase', true, false));

    expect(onBiometricIntent).toHaveBeenCalledWith({
      key: 'workspace-1',
      secret: 'my-passphrase',
      remember: true,
      sourcedFromBiometric: false,
    });
    await waitFor(() => expect(bootstrap.unlock).toHaveBeenCalledWith(ref, 'my-passphrase'));
  });

  it('reports a create that carries a secret, never one without', async () => {
    const bootstrap = createFakeBootstrap();
    const onBiometricIntent = vi.fn();
    const { result } = renderHook(() => useBootstrapScreen(bootstrap, onBiometricIntent));

    act(() => result.current.create(ref, { secret: 'new-passphrase' } as never, true));
    await waitFor(() => expect(bootstrap.create).toHaveBeenCalledTimes(1));
    expect(onBiometricIntent).toHaveBeenCalledWith({
      key: 'workspace-1',
      secret: 'new-passphrase',
      remember: true,
      sourcedFromBiometric: false,
    });

    onBiometricIntent.mockClear();
    act(() => result.current.create(ref, {} as never, true));
    await waitFor(() => expect(bootstrap.create).toHaveBeenCalledTimes(2));
    expect(onBiometricIntent).not.toHaveBeenCalled();
  });
});
