// @repo/platform-tauri — level 1.
// Verifies the plugin call shape and the graceful-degradation behavior on failure — the plugin
// itself (tauri-plugin-biometry) is exercised under a real Tauri runtime, not here
// (start-roadmap.md §13: no shared/adapter test starts Tauri).

import { describe, expect, it, vi } from 'vitest';

const checkStatus = vi.fn();
const hasData = vi.fn();
const getData = vi.fn();
const setData = vi.fn();
const removeData = vi.fn();

vi.mock('@choochmeque/tauri-plugin-biometry-api', () => ({
  BiometryType: { None: 0, Auto: 1, TouchID: 2, FaceID: 3, Iris: 4 },
  checkStatus: (...args: unknown[]) => checkStatus(...args),
  hasData: (...args: unknown[]) => hasData(...args),
  getData: (...args: unknown[]) => getData(...args),
  setData: (...args: unknown[]) => setData(...args),
  removeData: (...args: unknown[]) => removeData(...args),
}));

const { createTauriBiometricUnlock } = await import('./biometricUnlock');
const DOMAIN = 'com.myfinancehealth.desktop';

describe('createTauriBiometricUnlock', () => {
  it('maps a Touch ID status to its display label', async () => {
    checkStatus.mockResolvedValueOnce({ isAvailable: true, biometryType: 2 });
    const biometricUnlock = createTauriBiometricUnlock();

    await expect(biometricUnlock.status()).resolves.toEqual({ isAvailable: true, label: 'Touch ID' });
  });

  it('degrades to unavailable when the plugin throws (e.g. unsupported on Linux)', async () => {
    checkStatus.mockRejectedValueOnce(new Error('plugin not registered'));
    const biometricUnlock = createTauriBiometricUnlock();

    await expect(biometricUnlock.status()).resolves.toEqual({ isAvailable: false, label: 'Biometric unlock' });
  });

  it('resolves null, not a rejection, when a prompt is cancelled', async () => {
    getData.mockRejectedValueOnce(new Error('userCancel'));
    const biometricUnlock = createTauriBiometricUnlock();

    await expect(biometricUnlock.get('workspace-1', 'Unlock workspace')).resolves.toBeNull();
  });

  it('scopes get/set/remove to the fixed domain and the given key', async () => {
    getData.mockResolvedValueOnce({ domain: DOMAIN, name: 'workspace-1', data: 'the-passphrase' });
    setData.mockResolvedValueOnce(undefined);
    removeData.mockResolvedValueOnce(undefined);
    const biometricUnlock = createTauriBiometricUnlock();

    await expect(biometricUnlock.get('workspace-1', 'Unlock workspace')).resolves.toBe('the-passphrase');
    expect(getData).toHaveBeenCalledWith({ domain: DOMAIN, name: 'workspace-1', reason: 'Unlock workspace' });

    await biometricUnlock.set('workspace-1', 'the-passphrase');
    expect(setData).toHaveBeenCalledWith({ domain: DOMAIN, name: 'workspace-1', data: 'the-passphrase' });

    await biometricUnlock.remove('workspace-1');
    expect(removeData).toHaveBeenCalledWith({ domain: DOMAIN, name: 'workspace-1' });
  });

  it('has() returns false rather than throwing when the plugin call fails', async () => {
    hasData.mockRejectedValueOnce(new Error('plugin not registered'));
    const biometricUnlock = createTauriBiometricUnlock();

    await expect(biometricUnlock.has('workspace-1')).resolves.toBe(false);
  });
});
