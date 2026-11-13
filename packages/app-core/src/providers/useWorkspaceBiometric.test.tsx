import { createFakePlatform } from '@repo/platform/fakePlatform';
import type { Platform } from '@repo/platform/platform';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from './PlatformProvider';
import { useWorkspaceBiometric } from './useWorkspaceBiometric';
import { WorkspaceBiometricContext } from './workspaceBiometricContext';

function createService(overrides: Partial<BiometricUnlockService> = {}): BiometricUnlockService {
  return {
    status: vi.fn(() => Promise.resolve({ isAvailable: true, label: 'Face ID' })),
    has: vi.fn(() => Promise.resolve(true)),
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
}

function wrapperFor(platform: Platform, key: string | null) {
  return ({ children }: { readonly children: ReactNode }) => (
    <PlatformProvider platform={platform}>
      <WorkspaceBiometricContext.Provider value={key}>{children}</WorkspaceBiometricContext.Provider>
    </PlatformProvider>
  );
}

function platformWith(service: BiometricUnlockService | undefined): Platform {
  const base = createFakePlatform({ capabilities: { hasBiometricUnlock: service !== undefined } });
  return { ...base, ...(service ? { biometricUnlock: service } : {}) };
}

describe('useWorkspaceBiometric', () => {
  it('is unavailable when the platform declares no biometric unlock', () => {
    const { result } = renderHook(() => useWorkspaceBiometric(), {
      wrapper: wrapperFor(platformWith(undefined), 'w1'),
    });
    expect(result.current).toEqual({ isAvailable: false });
  });

  it('is unavailable without a workspace key (online mode, fixture)', async () => {
    const service = createService();
    const { result } = renderHook(() => useWorkspaceBiometric(), { wrapper: wrapperFor(platformWith(service), null) });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toEqual({ isAvailable: false });
    expect(service.has).not.toHaveBeenCalled();
  });

  it('reports the enrollment of the open workspace, and forgets it on demand', async () => {
    const service = createService();
    const { result } = renderHook(() => useWorkspaceBiometric(), { wrapper: wrapperFor(platformWith(service), 'w1') });

    await waitFor(() => expect(result.current.isAvailable).toBe(true));
    if (!result.current.isAvailable) {
      throw new Error('expected available');
    }
    expect(result.current.label).toBe('Face ID');
    expect(result.current.isEnrolled).toBe(true);
    expect(service.has).toHaveBeenCalledWith('w1');

    act(() => {
      if (result.current.isAvailable) {
        result.current.onForget();
      }
    });

    await waitFor(() => expect(result.current).toMatchObject({ isEnrolled: false, isUpdating: false }));
    expect(service.remove).toHaveBeenCalledWith('w1');
  });
});
