import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBiometricUnlockForm } from './useBiometricUnlockForm';

const ref: WorkspaceRef = { mode: 'local', id: 'workspace-1', path: '/w1.mfhdb', label: 'My workspace' };

function createFakeService(overrides: Partial<BiometricUnlockService> = {}): BiometricUnlockService {
  return {
    status: vi.fn(() => Promise.resolve({ isAvailable: true, label: 'Face ID' })),
    has: vi.fn(() => Promise.resolve(true)),
    get: vi.fn(() => Promise.resolve('biometric-secret')),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
}

describe('useBiometricUnlockForm', () => {
  it('auto-prompts once on an enrolled workspace and hands over the released secret', async () => {
    const service = createFakeService();
    const onBiometricSecret = vi.fn();
    renderHook(() => useBiometricUnlockForm({ workspaceRef: ref, service, onBiometricSecret }));

    await waitFor(() => expect(onBiometricSecret).toHaveBeenCalledWith('biometric-secret'));
    expect(service.get).toHaveBeenCalledTimes(1);
  });

  it('does not re-prompt after the user cancels the auto-prompt', async () => {
    const service = createFakeService({ get: vi.fn(() => Promise.resolve(null)) });
    const onBiometricSecret = vi.fn();
    const { rerender } = renderHook(() => useBiometricUnlockForm({ workspaceRef: ref, service, onBiometricSecret }));

    await waitFor(() => expect(service.get).toHaveBeenCalledTimes(1));
    rerender();
    rerender();

    expect(service.get).toHaveBeenCalledTimes(1);
    expect(onBiometricSecret).not.toHaveBeenCalled();
  });

  it('waits for canPrompt before auto-prompting (app still in the background)', async () => {
    const service = createFakeService();
    const onBiometricSecret = vi.fn();
    const { rerender } = renderHook(
      ({ canPrompt }: { canPrompt: boolean }) =>
        useBiometricUnlockForm({ workspaceRef: ref, service, onBiometricSecret, canPrompt }),
      { initialProps: { canPrompt: false } },
    );

    await waitFor(() => expect(service.has).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(service.get).not.toHaveBeenCalled();

    rerender({ canPrompt: true });
    await waitFor(() => expect(onBiometricSecret).toHaveBeenCalledWith('biometric-secret'));
  });

  it('never auto-prompts when the workspace has no entry', async () => {
    const service = createFakeService({ has: vi.fn(() => Promise.resolve(false)) });
    const onBiometricSecret = vi.fn();
    const { result } = renderHook(() => useBiometricUnlockForm({ workspaceRef: ref, service, onBiometricSecret }));

    await waitFor(() => expect(result.current.biometric.isSupported).toBe(true));
    expect(result.current.biometric.isEnrolled).toBe(false);
    expect(result.current.remember).toBe(false);
    expect(service.get).not.toHaveBeenCalled();
  });

  it('defaults the remember checkbox to the current enrollment, but stops once the user touches it', async () => {
    const service = createFakeService({ get: vi.fn(() => Promise.resolve(null)) });
    const { result } = renderHook(() =>
      useBiometricUnlockForm({ workspaceRef: ref, service, onBiometricSecret: vi.fn() }),
    );

    await waitFor(() => expect(result.current.remember).toBe(true));
    act(() => result.current.onRememberChange(false));
    expect(result.current.remember).toBe(false);
  });

  it('onBiometricUnlock triggers a fresh prompt on demand', async () => {
    const service = createFakeService({ has: vi.fn(() => Promise.resolve(false)) });
    const onBiometricSecret = vi.fn();
    const { result } = renderHook(() => useBiometricUnlockForm({ workspaceRef: ref, service, onBiometricSecret }));

    act(() => result.current.onBiometricUnlock());
    await waitFor(() => expect(onBiometricSecret).toHaveBeenCalledWith('biometric-secret'));
  });
});
