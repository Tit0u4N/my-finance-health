// @repo/data — level 1.
// Get-or-create device id: 16 lowercase hex characters (8 random bytes), used to name this
// device's journal segments and lock entries (start-roadmap.md §9: "the device ID is carried by
// the segment file name, which is enough for future merge without exposing more"). Stored once
// in the platform key-value store — it identifies this installation, not a single workspace, so
// it is shared across every local workspace this device opens.

import type { KeyValueStore } from '@repo/platform/services/keyValueStore';
import type { RandomService } from '@repo/platform/services/random';

const DEVICE_ID_KEY = 'device-id';

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function getOrCreateDeviceId(store: KeyValueStore, random: RandomService): Promise<string> {
  const existing = await store.get(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = bytesToHex(random.bytes(8));
  await store.set(DEVICE_ID_KEY, id);
  return id;
}
