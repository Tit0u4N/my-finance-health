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

// Biometric behaviour (auto-prompt, cancel, remember default) is tested once, in @repo/app-core's
// useBiometricUnlockForm.test.ts — this file only covers how desktop maps it onto onUnlock.
describe('useUnlockWorkspaceForm', () => {
  it('auto-prompts once on an enrolled workspace and unlocks with the released secret', async () => {
    const service = createFakeService();
    const onUnlock = vi.fn();
    renderHook(() => useUnlockWorkspaceForm({ workspaceRef: ref, biometricUnlock: service, onUnlock }));

    await waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(1));
    expect(onUnlock).toHaveBeenCalledWith(ref, 'biometric-secret', true, true);
    expect(service.get).toHaveBeenCalledTimes(1);
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
