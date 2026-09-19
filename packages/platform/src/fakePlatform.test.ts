import { describe, expect, it } from 'vitest';
import { createFakePlatform } from './fakePlatform';

describe('createFakePlatform', () => {
  it('exposes deterministic time and identity primitives', () => {
    const platform = createFakePlatform({ now: '2026-03-01T00:00:00.000Z', systemTimezone: 'Europe/Paris' });

    expect(platform.clock.now()).toBe('2026-03-01T00:00:00.000Z');
    expect(platform.clock.systemTimezone()).toBe('Europe/Paris');
    expect(platform.random.uuid()).toBe('fake-id-1');
    expect(platform.random.uuid()).toBe('fake-id-2');
  });

  it('round-trips values through the in-memory key-value store', async () => {
    const platform = createFakePlatform();

    await platform.keyValueStore.set('recent-workspaces', '["a"]');
    expect(await platform.keyValueStore.get('recent-workspaces')).toBe('["a"]');

    await platform.keyValueStore.remove('recent-workspaces');
    expect(await platform.keyValueStore.get('recent-workspaces')).toBeNull();
  });

  it('round-trips bytes through the in-memory file system', async () => {
    const platform = createFakePlatform();
    const path = platform.fileSystem?.resolvePath('workspace', 'db.sqlite');
    if (!(path && platform.fileSystem)) {
      throw new Error('fake platform did not expose a file system despite the default capability');
    }

    await platform.fileSystem.writeFile(path, new Uint8Array([1, 2, 3]));
    expect(await platform.fileSystem.readFile(path)).toEqual(new Uint8Array([1, 2, 3]));
    expect(await platform.fileSystem.listDirectory('workspace')).toEqual([path]);
  });

  it('omits optional services whose capability is declared false', () => {
    const platform = createFakePlatform({
      capabilities: {
        hasSecretVault: false,
        hasBiometricUnlock: false,
        canWriteFile: false,
        hasEncryptedSqlDriver: false,
      },
    });

    expect(platform.secrets).toBeUndefined();
    expect(platform.biometricUnlock).toBeUndefined();
    expect(platform.fileSystem).toBeUndefined();
    expect(platform.sqlDriver).toBeUndefined();
  });

  it('round-trips a stored secret through the in-memory biometric-unlock store', async () => {
    const platform = createFakePlatform();
    const biometricUnlock = platform.biometricUnlock;
    if (!biometricUnlock) {
      throw new Error('fake platform did not expose biometric unlock despite the default capability');
    }

    expect(await biometricUnlock.status()).toEqual({ isAvailable: true, label: 'Biometric unlock' });
    expect(await biometricUnlock.has('workspace-1')).toBe(false);

    await biometricUnlock.set('workspace-1', 'the-passphrase');
    expect(await biometricUnlock.has('workspace-1')).toBe(true);
    expect(await biometricUnlock.get('workspace-1', 'Unlock workspace')).toBe('the-passphrase');

    await biometricUnlock.remove('workspace-1');
    expect(await biometricUnlock.has('workspace-1')).toBe(false);
  });

  it('appends without rewriting the file, and truncates it', async () => {
    const platform = createFakePlatform();
    const fileSystem = platform.fileSystem;
    if (!fileSystem) {
      throw new Error('fake platform did not expose a file system despite the default capability');
    }

    await fileSystem.writeFile('journal.mfhj', new Uint8Array([1, 2]));
    await fileSystem.appendFile('journal.mfhj', new Uint8Array([3, 4]));
    expect(await fileSystem.readFile('journal.mfhj')).toEqual(new Uint8Array([1, 2, 3, 4]));

    await fileSystem.truncateFile('journal.mfhj', 2);
    expect(await fileSystem.readFile('journal.mfhj')).toEqual(new Uint8Array([1, 2]));
  });

  it('reports file info against the frozen clock, and null for a missing path', async () => {
    const platform = createFakePlatform({ now: '2026-03-01T00:00:00.000Z' });
    const fileSystem = platform.fileSystem;
    if (!fileSystem) {
      throw new Error('fake platform did not expose a file system despite the default capability');
    }

    await fileSystem.writeFile('db.mfhdb', new Uint8Array([1, 2, 3]));
    expect(await fileSystem.fileInfo('db.mfhdb')).toEqual({
      sizeBytes: 3,
      modifiedAt: '2026-03-01T00:00:00.000Z',
    });
    expect(await fileSystem.fileInfo('missing.mfhdb')).toBeNull();
  });

  it('renames a file and exposes an app-data directory outside any synced folder', async () => {
    const platform = createFakePlatform();
    const fileSystem = platform.fileSystem;
    if (!fileSystem) {
      throw new Error('fake platform did not expose a file system despite the default capability');
    }

    await fileSystem.writeFile('old.mfhdb', new Uint8Array([9]));
    await fileSystem.rename('old.mfhdb', 'new.mfhdb');
    expect(await fileSystem.readFile('new.mfhdb')).toEqual(new Uint8Array([9]));
    await expect(fileSystem.readFile('old.mfhdb')).rejects.toThrow();

    expect(await fileSystem.appDataDirectory()).toBe('/app-data');
  });
});
