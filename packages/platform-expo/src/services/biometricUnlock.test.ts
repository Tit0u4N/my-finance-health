import { beforeEach, describe, expect, it, vi } from 'vitest';

type Options = { requireAuthentication?: boolean; authenticationPrompt?: string };

const items = vi.hoisted(() => new Map<string, { value: string; auth: boolean }>());
const native = vi.hoisted(() => ({
  hasHardware: true,
  isEnrolled: true,
  types: [2] as number[],
  isStoreAvailable: true,
  canUseBiometrics: true,
  promptResult: 'release' as 'release' | 'cancel',
  prompts: [] as string[],
}));

vi.mock('expo-local-authentication', () => ({
  // biome-ignore lint/style/useNamingConvention: mirrors expo-local-authentication's enum members
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
  hasHardwareAsync: () => Promise.resolve(native.hasHardware),
  isEnrolledAsync: () => Promise.resolve(native.isEnrolled),
  supportedAuthenticationTypesAsync: () => Promise.resolve(native.types),
}));

vi.mock('expo-secure-store', () => ({
  // biome-ignore lint/style/useNamingConvention: mirrors expo-secure-store's exported constant
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 6,
  // biome-ignore lint/style/useNamingConvention: mirrors expo-secure-store's exported constant
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 5,
  isAvailableAsync: () => Promise.resolve(native.isStoreAvailable),
  canUseBiometricAuthentication: () => native.canUseBiometrics,
  setItemAsync: (key: string, value: string, options: Options) => {
    items.set(key, { value, auth: options.requireAuthentication === true });
    return Promise.resolve();
  },
  // Mirrors the native module: an authentication-bound item prompts, a cancelled prompt throws.
  getItemAsync: (key: string, options: Options) => {
    const item = items.get(key);
    if (!item) {
      return Promise.resolve(null);
    }
    if (item.auth) {
      native.prompts.push(options.authenticationPrompt ?? '');
      if (native.promptResult === 'cancel') {
        return Promise.reject(new Error('User canceled the operation.'));
      }
    }
    return Promise.resolve(item.value);
  },
  deleteItemAsync: (key: string) => {
    items.delete(key);
    return Promise.resolve();
  },
}));

const { createExpoBiometricUnlock, labelFor, toStoreKey } = await import('./biometricUnlock');

beforeEach(() => {
  items.clear();
  Object.assign(native, {
    hasHardware: true,
    isEnrolled: true,
    types: [2],
    isStoreAvailable: true,
    canUseBiometrics: true,
    promptResult: 'release',
    prompts: [],
  });
});

describe('toStoreKey', () => {
  it('maps any workspace id onto the characters secure-store accepts, injectively', () => {
    expect(toStoreKey('MyFinanceHealth/workspaces/ab-12/w.mfhdb')).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(toStoreKey('a/b')).not.toBe(toStoreKey('a_b'));
    expect(toStoreKey('a_002fb')).not.toBe(toStoreKey('a/b'));
  });
});

describe('labelFor', () => {
  it('names the biometric the way each OS does', () => {
    expect(labelFor([2], 'ios')).toBe('Face ID');
    expect(labelFor([1], 'ios')).toBe('Touch ID');
    expect(labelFor([1], 'android')).toBe('Fingerprint');
    expect(labelFor([], 'ios')).toBe('Biometric unlock');
  });
});

describe('createExpoBiometricUnlock', () => {
  it('is available only with hardware, an enrolled biometric and a usable secure store', async () => {
    const service = createExpoBiometricUnlock({ os: 'ios' });
    await expect(service.status()).resolves.toEqual({ isAvailable: true, label: 'Face ID' });

    native.isEnrolled = false;
    await expect(service.status()).resolves.toEqual({ isAvailable: false, label: 'Face ID' });
  });

  it('stores an authentication-bound copy, and has() never prompts', async () => {
    const service = createExpoBiometricUnlock({ os: 'ios' });
    await expect(service.has('ws/1')).resolves.toBe(false);

    await service.set('ws/1', 'the-passphrase');

    expect(items.get(toStoreKey('ws/1'))).toEqual({ value: 'the-passphrase', auth: true });
    await expect(service.has('ws/1')).resolves.toBe(true);
    expect(native.prompts).toEqual([]);
  });

  it('get() prompts with the reason and releases the secret', async () => {
    const service = createExpoBiometricUnlock({ os: 'ios' });
    await service.set('ws/1', 'the-passphrase');

    await expect(service.get('ws/1', 'Unlock your workspace')).resolves.toBe('the-passphrase');
    expect(native.prompts).toEqual(['Unlock your workspace']);
  });

  it('get() resolves null when the prompt is cancelled, never throws', async () => {
    const service = createExpoBiometricUnlock({ os: 'ios' });
    await service.set('ws/1', 'the-passphrase');
    native.promptResult = 'cancel';

    await expect(service.get('ws/1', 'Unlock')).resolves.toBeNull();
  });

  it('remove() forgets both the secret and its marker', async () => {
    const service = createExpoBiometricUnlock({ os: 'ios' });
    await service.set('ws/1', 'the-passphrase');

    await service.remove('ws/1');

    expect(items.size).toBe(0);
    await expect(service.has('ws/1')).resolves.toBe(false);
  });
});
