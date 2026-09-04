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
      capabilities: { hasSecretVault: false, canWriteFile: false, hasEncryptedSqlDriver: false },
    });

    expect(platform.secrets).toBeUndefined();
    expect(platform.fileSystem).toBeUndefined();
    expect(platform.sqlDriver).toBeUndefined();
  });
});
