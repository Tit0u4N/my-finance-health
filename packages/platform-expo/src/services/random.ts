// @repo/platform-expo — level 1.
// RandomService on expo-crypto (native CSPRNG) — Hermes has no `crypto.getRandomValues`.

import type { RandomService } from '@repo/platform/services/random';
import { getRandomBytes, randomUUID } from 'expo-crypto';

export function createExpoRandom(): RandomService {
  return {
    uuid: () => randomUUID(),
    bytes: (length) => getRandomBytes(length),
  };
}
