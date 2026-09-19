import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useUnlockWorkspaceForm } from './useUnlockWorkspaceForm';

const ref: WorkspaceRef = { mode: 'local', id: 'workspace-1', path: '/w1.mfhdb', label: 'My workspace' };

function createFakeService(overrides: Partial<BiometricUnlockService> = {}): BiometricUnlockService {
  return {
    status: vi.fn(() => Promise.resolve({ isAvailable: true, label: 'Touch ID' })),
    has: vi.fn(() => Promise.resolve(true)),
    get: vi.fn(() => Promise.resolve('biometric-secret')),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
}

describe('useUnlockWorkspaceForm', () => {
  it('auto-prompts once on an enrolled workspace and unlocks with the released secret', async () => {
    const service = createFakeService();
    const onUnlock = vi.fn();
    renderHook(() => useUnlockWorkspaceForm({ workspaceRef: ref, biometricUnlock: service, onUnlock }));

    await waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(1));
    expect(onUnlock).toHaveBeenCalledWith(ref, 'biometric-secret', true, true);
    expect(service.get).toHaveBeenCalledTimes(1);
  });

  it('does not re-prompt after the user cancels the auto-prompt', async () => {
    const service = createFakeService({ get: vi.fn(() => Promise.resolve(null)) });
    const onUnlock = vi.fn();
    const { result, rerender } = renderHook(() =>
      useUnlockWorkspaceForm({ workspaceRef: ref, biometricUnlock: service, onUnlock }),
    );

    await waitFor(() => expect(service.get).toHaveBeenCalledTimes(1));
    rerender();
    rerender();

    expect(service.get).toHaveBeenCalledTimes(1);
    expect(onUnlock).not.toHaveBeenCalled();
    expect(result.current.canSubmit).toBe(false);
  });

  it('defaults the remember checkbox to the current enrollment, but stops once the user touches it', async () => {
    const service = createFakeService({ get: vi.fn(() => Promise.resolve(null)) });
    const onUnlock = vi.fn();
    const { result } = renderHook(() =>
      useUnlockWorkspaceForm({ workspaceRef: ref, biometricUnlock: service, onUnlock }),
    );

    await waitFor(() => expect(result.current.remember).toBe(true));

    act(() => result.current.onRememberChange(false));
    expect(result.current.remember).toBe(false);
  });

  it('a manual passphrase submit is never marked as sourced from biometrics', () => {
    const service = createFakeService({ has: vi.fn(() => Promise.resolve(false)) });
    const onUnlock = vi.fn();
    const { result } = renderHook(() =>
      useUnlockWorkspaceForm({ workspaceRef: ref, biometricUnlock: service, onUnlock }),
    );

    act(() => result.current.onSecretChange('typed-secret'));
    act(() => result.current.onSubmit());

    expect(onUnlock).toHaveBeenCalledWith(ref, 'typed-secret', false, false);
  });

  it('onBiometricUnlock triggers a fresh prompt on demand', async () => {
    const service = createFakeService({ has: vi.fn(() => Promise.resolve(false)) });
    const onUnlock = vi.fn();
    const { result } = renderHook(() =>
      useUnlockWorkspaceForm({ workspaceRef: ref, biometricUnlock: service, onUnlock }),
    );

    act(() => result.current.onBiometricUnlock());

    await waitFor(() => expect(onUnlock).toHaveBeenCalledWith(ref, 'biometric-secret', true, true));
  });
});
