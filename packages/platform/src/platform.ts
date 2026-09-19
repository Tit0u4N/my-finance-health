// @repo/platform — level 0.
// The full service bundle an app assembles and injects at composition time. Optional services
// are present exactly when their matching capability flag is true — consumers check the flag,
// never `service !== undefined` as a proxy for it, so the two can never silently disagree.

import type { PlatformCapabilities } from './capabilities';
import type { BiometricUnlockService } from './services/biometricUnlock';
import type { Clock } from './services/clock';
import type { FileSystemService } from './services/fileSystem';
import type { HttpClientService } from './services/httpClient';
import type { KeyValueStore } from './services/keyValueStore';
import type { LocalizationService } from './services/localization';
import type { RandomService } from './services/random';
import type { SecretsService } from './services/secrets';
import type { SqlDriver } from './services/sqlDriver';

export type Platform = {
  readonly capabilities: PlatformCapabilities;
  readonly keyValueStore: KeyValueStore;
  readonly clock: Clock;
  readonly random: RandomService;
  readonly localization: LocalizationService;
  readonly http: HttpClientService;
  readonly secrets?: SecretsService;
  readonly biometricUnlock?: BiometricUnlockService;
  readonly fileSystem?: FileSystemService;
  readonly sqlDriver?: SqlDriver;
};
