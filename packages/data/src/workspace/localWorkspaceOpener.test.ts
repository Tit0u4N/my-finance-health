// @repo/data — level 1.

import { isErr, isOk } from '@repo/domain/primitives/result';
import { createFakePlatform } from '@repo/platform/fakePlatform';
import type { KeyValueStore } from '@repo/platform/services/keyValueStore';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import { describe, expect, it } from 'vitest';
import { createNodeSqliteTestDriver } from '../local/sql/nodeSqliteTestDriver';
import { createLocalWorkspaceOpener, type LocalWorkspaceSession } from './localWorkspaceOpener';
import type { LocalWorkspaceRef } from './workspaceRef';

// Each test gets its own path: the SQL test driver's registry (nodeSqliteTestDriver.ts) persists
// data across close+reopen keyed by path, on purpose — reusing one path across tests would leak
// a previous test's database into the next one.
let refCounter = 0;
function makeRef(): LocalWorkspaceRef {
  refCounter += 1;
  return { mode: 'local', id: `w${refCounter}`, path: `/workspace/test-${refCounter}.mfhdb`, label: 'test' };
}

/** Pre-seeded with a fixed device id — createFakePlatform's fake random resets its counter per
 * instance, so two independently-constructed fake platforms would otherwise derive the exact
 * same "random" device id and defeat the held-elsewhere scenarios below. */
function createDeviceKeyValueStore(deviceId: string): KeyValueStore {
  const store = new Map<string, string>([['device-id', deviceId]]);
  return {
    get: (key) => Promise.resolve(store.get(key) ?? null),
    set: (key, value) => {
      store.set(key, value);
      return Promise.resolve();
    },
    remove: (key) => {
      store.delete(key);
      return Promise.resolve();
    },
  };
}

function createOpener(
  overrides: {
    readonly sqlDriver?: SqlDriver;
    readonly keyValueStore?: KeyValueStore;
    readonly deviceId?: string;
  } = {},
) {
  const platform = createFakePlatform();
  const fileSystem = platform.fileSystem as NonNullable<typeof platform.fileSystem>;
  const sessions: LocalWorkspaceSession[] = [];
  const opener = createLocalWorkspaceOpener({
    fileSystem,
    sqlDriver: overrides.sqlDriver ?? createNodeSqliteTestDriver({ fileSystem }),
    keyValueStore: overrides.keyValueStore ?? createDeviceKeyValueStore(overrides.deviceId ?? 'aaaaaaaaaaaaaaaa'),
    clock: platform.clock,
    random: platform.random,
    onSessionOpen: (session) => sessions.push(session),
  });
  return { opener, fileSystem, sessions };
}

describe('createLocalWorkspaceOpener', () => {
  it('create() rejects without a passphrase', async () => {
    const { opener } = createOpener();

    const result = await opener.create(makeRef(), { timezone: 'UTC' as never, baseCurrency: 'EUR' });

    expect(isErr(result) && result.error.kind).toBe('validation');
  });

  it('create() rejects when a file already exists at that path', async () => {
    const { opener, fileSystem } = createOpener();
    const ref = makeRef();
    await fileSystem.writeFile(ref.path, new Uint8Array([1]));

    const result = await opener.create(ref, { timezone: 'UTC' as never, baseCurrency: 'EUR', secret: 'pw' });

    expect(isErr(result) && result.error.kind).toBe('conflict');
  });

  it('create() reaches ready and hands off a session', async () => {
    const { opener, sessions } = createOpener();

    const result = await opener.create(makeRef(), { timezone: 'UTC' as never, baseCurrency: 'EUR', secret: 'pw' });

    expect(isOk(result) && result.value.kind).toBe('ready');
    expect(sessions).toHaveLength(1);
  });

  it('create() writes a readable workspaceSettings record with the given input', async () => {
    const { opener } = createOpener();

    const result = await opener.create(makeRef(), {
      timezone: 'Europe/Paris' as never,
      baseCurrency: 'GBP',
      secret: 'pw',
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result) && result.value.kind === 'ready') {
      const settings = await result.value.repositories.workspaceSettings.get();
      expect(isOk(settings) && settings.value.baseCurrency).toBe('GBP');
      expect(isOk(settings) && settings.value.timezone).toBe('Europe/Paris');
    }
  });

  it('open() reports not-found when the database file does not exist', async () => {
    const { opener } = createOpener();

    const result = await opener.open(makeRef());

    expect(isErr(result) && result.error.kind).toBe('not-found');
  });

  it('open() reports integrity when the database exists but .mfhmeta does not', async () => {
    const { opener, fileSystem } = createOpener();
    const ref = makeRef();
    await fileSystem.writeFile(ref.path, new Uint8Array([1]));

    const result = await opener.open(ref);

    expect(isErr(result) && result.error.kind).toBe('integrity');
  });

  it('open() reports needs-unlock once the workspace has been created', async () => {
    const { opener } = createOpener();
    const ref = makeRef();
    await opener.create(ref, { timezone: 'UTC' as never, baseCurrency: 'EUR', secret: 'pw' });

    const result = await opener.open(ref);

    expect(isOk(result) && result.value.kind).toBe('needs-unlock');
  });

  it('unlock() on a path with no workspace reports integrity', async () => {
    const { opener } = createOpener();

    const result = await opener.unlock(makeRef(), 'pw');

    expect(isErr(result) && result.error.kind).toBe('integrity');
  });

  it('unlock() after create() (same connection, simulating a resumed session) reaches ready and sees prior data', async () => {
    const { opener } = createOpener();
    const ref = makeRef();
    await opener.create(ref, { timezone: 'UTC' as never, baseCurrency: 'EUR', secret: 'pw' });

    const result = await opener.unlock(ref, 'pw');

    expect(isOk(result) && result.value.kind).toBe('ready');
    if (isOk(result) && result.value.kind === 'ready') {
      const settings = await result.value.repositories.workspaceSettings.get();
      expect(isOk(settings) && settings.value.baseCurrency).toBe('EUR');
    }
  });

  it('unlock() survives an explicit session close and reopen on the same path', async () => {
    const sqlDriver = createNodeSqliteTestDriver();
    const keyValueStore = createDeviceKeyValueStore('aaaaaaaaaaaaaaaa');
    const { opener, sessions } = createOpener({ sqlDriver, keyValueStore });
    const ref = makeRef();
    await opener.create(ref, { timezone: 'UTC' as never, baseCurrency: 'EUR', secret: 'pw' });
    await sessions[0]?.close();

    const result = await opener.unlock(ref, 'pw');

    expect(isOk(result) && result.value.kind).toBe('ready');
  });

  it('unlock() fails when the lock is held by another device', async () => {
    const platformDeviceA = createOpener();
    const ref = makeRef();
    await platformDeviceA.opener.create(ref, { timezone: 'UTC' as never, baseCurrency: 'EUR', secret: 'pw' });

    // Same file system (so the lock file is shared), a fresh sql driver (its registry is keyed
    // by path and shared at module scope, so it sees the same "file"), but a different device id
    // — simulating a second machine seeing the same workspace.
    const deviceB = createLocalWorkspaceOpener({
      fileSystem: platformDeviceA.fileSystem,
      sqlDriver: createNodeSqliteTestDriver(),
      keyValueStore: createDeviceKeyValueStore('bbbbbbbbbbbbbbbb'),
      clock: createFakePlatform().clock,
      random: createFakePlatform().random,
    });

    const result = await deviceB.unlock(ref, 'pw');

    expect(isErr(result) && result.error.kind).toBe('conflict');
  });
});
