import { createFakePlatform } from '@repo/platform/fakePlatform';
import { describe, expect, it } from 'vitest';
import { getOrCreateDeviceId } from './deviceId';

describe('getOrCreateDeviceId', () => {
  it('creates a 16-character lowercase hex id and persists it', async () => {
    const platform = createFakePlatform();
    const id = await getOrCreateDeviceId(platform.keyValueStore, platform.random);

    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(await platform.keyValueStore.get('device-id')).toBe(id);
  });

  it('returns the same id on a second call without generating a new one', async () => {
    const platform = createFakePlatform();
    const first = await getOrCreateDeviceId(platform.keyValueStore, platform.random);
    const second = await getOrCreateDeviceId(platform.keyValueStore, platform.random);
    expect(second).toBe(first);
  });
});
