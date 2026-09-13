import { isErr } from '@repo/domain/primitives/result';
import { createFakePlatform } from '@repo/platform/fakePlatform';
import { describe, expect, it } from 'vitest';
import { acquireLock, classifyLock, type LockFile, readLockFile, refreshLock, releaseLock } from './occupancyLock';

const STALENESS_MS = 60_000;

const BASE_LOCK: LockFile = {
  v: 1,
  deviceId: 'other-device',
  sessionId: 'session-1',
  acquiredAt: '2026-01-01T00:00:00.000Z',
  refreshedAt: '2026-01-01T00:00:00.000Z',
};

describe('classifyLock', () => {
  it('is free when no lock exists', () => {
    expect(classifyLock(null, 'this-device', '2026-01-01T00:01:00.000Z', STALENESS_MS)).toEqual({ kind: 'free' });
  });

  it('is same-device (always unclean shutdown) when the lock belongs to this device', () => {
    const lock: LockFile = { ...BASE_LOCK, deviceId: 'this-device' };
    const result = classifyLock(lock, 'this-device', '2026-01-01T00:00:05.000Z', STALENESS_MS);
    expect(result).toEqual({
      kind: 'same-device',
      uncleanShutdown: true,
      holder: { deviceId: 'this-device', sessionId: 'session-1', refreshedAt: BASE_LOCK.refreshedAt },
    });
  });

  it('is held-elsewhere when another device refreshed the lock recently', () => {
    const now = '2026-01-01T00:00:30.000Z'; // 30s after refreshedAt, under the 60s threshold
    const result = classifyLock(BASE_LOCK, 'this-device', now, STALENESS_MS);
    expect(result.kind).toBe('held-elsewhere');
  });

  it('is stale-elsewhere once the staleness threshold has passed', () => {
    const now = '2026-01-01T00:01:01.000Z'; // 61s after refreshedAt
    const result = classifyLock(BASE_LOCK, 'this-device', now, STALENESS_MS);
    expect(result.kind).toBe('stale-elsewhere');
  });

  it('is held-elsewhere just under the threshold, stale exactly at and past it', () => {
    const justUnder = classifyLock(BASE_LOCK, 'this-device', '2026-01-01T00:00:59.999Z', STALENESS_MS);
    expect(justUnder.kind).toBe('held-elsewhere');
    const atThreshold = classifyLock(BASE_LOCK, 'this-device', '2026-01-01T00:01:00.000Z', STALENESS_MS);
    expect(atThreshold.kind).toBe('stale-elsewhere');
  });
});

function fileSystem() {
  const platform = createFakePlatform();
  if (!platform.fileSystem) {
    throw new Error('fake platform did not expose a file system despite the default capability');
  }
  return platform.fileSystem;
}

describe('acquireLock / refreshLock / releaseLock', () => {
  it('round-trips: acquire writes a lock classifyLock reads back as free-turned-same-device', async () => {
    const fs = fileSystem();
    const platform = createFakePlatform();
    const deps = {
      fileSystem: fs,
      clock: platform.clock,
      random: platform.random,
      lockPath: '/ws/finances.mfhlock',
      deviceId: 'device-a',
    };

    expect(await readLockFile(fs, deps.lockPath)).toBeNull();
    const acquired = await acquireLock(deps);
    if (!acquired.ok) {
      throw new Error('acquireLock unexpectedly failed');
    }

    const written = await readLockFile(fs, deps.lockPath);
    expect(written?.deviceId).toBe('device-a');
    expect(written?.sessionId).toBe(acquired.value.sessionId);
  });

  it('refresh updates refreshedAt while keeping the same session', async () => {
    const fs = fileSystem();
    const platform = createFakePlatform({ now: '2026-01-01T00:00:00.000Z' });
    const deps = {
      fileSystem: fs,
      clock: platform.clock,
      random: platform.random,
      lockPath: '/ws/finances.mfhlock',
      deviceId: 'device-a',
    };

    const acquired = await acquireLock(deps);
    if (!acquired.ok) {
      throw new Error('acquireLock unexpectedly failed');
    }

    const laterPlatform = createFakePlatform({ now: '2026-01-01T00:00:15.000Z' });
    const laterDeps = { ...deps, clock: laterPlatform.clock };
    const refreshed = await refreshLock(laterDeps, acquired.value);
    expect(refreshed.ok).toBe(true);

    const onDisk = await readLockFile(fs, deps.lockPath);
    expect(onDisk?.sessionId).toBe(acquired.value.sessionId);
    expect(onDisk?.refreshedAt).toBe('2026-01-01T00:00:15.000Z');
    expect(onDisk?.acquiredAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('refresh fails once another session has taken over the lock', async () => {
    const fs = fileSystem();
    const platform = createFakePlatform();
    const deps = {
      fileSystem: fs,
      clock: platform.clock,
      random: platform.random,
      lockPath: '/ws/finances.mfhlock',
      deviceId: 'device-a',
    };

    const acquired = await acquireLock(deps);
    if (!acquired.ok) {
      throw new Error('acquireLock unexpectedly failed');
    }
    // A different device takes over.
    await acquireLock({ ...deps, deviceId: 'device-b' });

    const result = await refreshLock(deps, acquired.value);
    expect(isErr(result)).toBe(true);
  });

  it('release removes the lock file when this session still owns it', async () => {
    const fs = fileSystem();
    const platform = createFakePlatform();
    const deps = {
      fileSystem: fs,
      clock: platform.clock,
      random: platform.random,
      lockPath: '/ws/finances.mfhlock',
      deviceId: 'device-a',
    };

    const acquired = await acquireLock(deps);
    if (!acquired.ok) {
      throw new Error('acquireLock unexpectedly failed');
    }
    await releaseLock(deps, acquired.value);
    expect(await readLockFile(fs, deps.lockPath)).toBeNull();
  });

  it("release does nothing when another session has taken over the lock (never steals a peer's lock)", async () => {
    const fs = fileSystem();
    const platform = createFakePlatform();
    const deps = {
      fileSystem: fs,
      clock: platform.clock,
      random: platform.random,
      lockPath: '/ws/finances.mfhlock',
      deviceId: 'device-a',
    };

    const acquired = await acquireLock(deps);
    if (!acquired.ok) {
      throw new Error('acquireLock unexpectedly failed');
    }
    const takeOver = await acquireLock({ ...deps, deviceId: 'device-b' });
    if (!takeOver.ok) {
      throw new Error('acquireLock unexpectedly failed');
    }

    await releaseLock(deps, acquired.value);
    const onDisk = await readLockFile(fs, deps.lockPath);
    expect(onDisk?.sessionId).toBe(takeOver.value.sessionId);
  });
});
