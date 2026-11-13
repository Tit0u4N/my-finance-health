import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBiometricUnlock } from './useBiometricUnlock';

const ref: WorkspaceRef = { mode: 'local', id: 'workspace-1', path: '/w1.mfhdb', label: 'My workspace' };

function createFakeService(overrides: Partial<BiometricUnlockService> = {}): BiometricUnlockService {
  return {
    status: vi.fn(() => Promise.resolve({ isAvailable: true, label: 'Touch ID' })),
    has: vi.fn(() => Promise.resolve(false)),
    get: vi.fn(() => Promise.resolve('the-passphrase')),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
}

describe('useBiometricUnlock', () => {
  it('reports unsupported and never checks enrollment when no service is present', async () => {
    const { result } = renderHook(() => useBiometricUnlock({ service: undefined, ref }));

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isChecking).toBe(false);
    await expect(result.current.prompt()).resolves.toBeNull();
  });

  it('resolves availability and enrollment for the given workspace ref', async () => {
    const service = createFakeService({ has: vi.fn(() => Promise.resolve(true)) });
    const { result } = renderHook(() => useBiometricUnlock({ service, ref }));

    expect(result.current.isChecking).toBe(true);
    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.isSupported).toBe(true);
    expect(result.current.label).toBe('Touch ID');
    expect(result.current.isEnrolled).toBe(true);
    expect(service.has).toHaveBeenCalledWith('workspace-1');
  });

  it('skips the enrollment check when hardware is unavailable', async () => {
    const service = createFakeService({ status: vi.fn(() => Promise.resolve({ isAvailable: false, label: '' })) });
    const { result } = renderHook(() => useBiometricUnlock({ service, ref }));

    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isEnrolled).toBe(false);
    expect(service.has).not.toHaveBeenCalled();
  });

  it('prompt() delegates to the service with a fixed unlock reason', async () => {
    const service = createFakeService();
    const { result } = renderHook(() => useBiometricUnlock({ service, ref }));

    await expect(result.current.prompt()).resolves.toBe('the-passphrase');
    expect(service.get).toHaveBeenCalledWith('workspace-1', 'Unlock your workspace');
  });
});
