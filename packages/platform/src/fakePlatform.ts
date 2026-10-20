// @repo/platform — level 0.
// The fake platform every shared-logic test runs against (start-roadmap.md §13): deterministic
// clock, counter-seeded ids, in-memory storage. No shared test starts a real adapter.

import ky from 'ky';
import type { PlatformCapabilities } from './capabilities';
import type { Platform } from './platform';
import type { BiometricUnlockService } from './services/biometricUnlock';
import type { Clock } from './services/clock';
import type { FileSystemService } from './services/fileSystem';
import type { KeyValueStore } from './services/keyValueStore';
import type { RandomService } from './services/random';
import type { SqlDriver } from './services/sqlDriver';

const DEFAULT_CAPABILITIES: PlatformCapabilities = {
  canWriteFile: true,
  canPickFile: true,
  canResumeLocation: true,
  hasSecretVault: true,
  hasBiometricUnlock: true,
  hasEncryptedSqlDriver: true,
  worksOffline: true,
  canControlWindow: true,
  canUpdate: true,
};

const DEFAULT_NOW = '2026-01-01T00:00:00.000Z';
const DEFAULT_TIMEZONE = 'UTC';
const DEFAULT_LOCALE = 'en-US';

export type CreateFakePlatformOptions = {
  readonly capabilities?: Partial<PlatformCapabilities>;
  readonly now?: string;
  readonly systemTimezone?: string;
  readonly locale?: string;
};

function createInMemoryStore(): KeyValueStore {
  const store = new Map<string, string>();

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

function createFakeClock(now: string, systemTimezone: string): Clock {
  return {
    now: () => now,
    systemTimezone: () => systemTimezone,
  };
}

function createFakeRandom(): RandomService {
  let counter = 0;

  return {
    uuid: () => {
      counter += 1;
      return `fake-id-${counter}`;
    },
    bytes: (length) => {
      // Advances the shared counter so consecutive calls differ, matching what a caller relying
      // on `bytes()` for uniqueness (nonces, session ids, journal entries) needs from a real
      // random source — a fake that returned the same bytes twice in a row would make that class
      // of behaviour untestable.
      counter += 1;
      const out = new Uint8Array(length);
      for (let index = 0; index < length; index += 1) {
        out[index] = (counter + index) % 256;
      }
      return out;
    },
  };
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function createFakeFileSystem(clock: Clock): FileSystemService {
  const files = new Map<string, Uint8Array>();
  const directories = new Set<string>(['/app-data', '/app-data/backups']);

  return {
    readFile: (path) => {
      const data = files.get(path);
      if (!data) {
        return Promise.reject(new Error(`fake file system: no file at "${path}"`));
      }
      return Promise.resolve(data);
    },
    writeFile: (path, data) => {
      files.set(path, data);
      return Promise.resolve();
    },
    appendFile: (path, data) => {
      const existing = files.get(path);
      files.set(path, existing ? concatBytes(existing, data) : data);
      return Promise.resolve();
    },
    truncateFile: (path, length) => {
      const existing = files.get(path);
      if (existing) {
        files.set(path, existing.slice(0, length));
      }
      return Promise.resolve();
    },
    deleteFile: (path) => {
      files.delete(path);
      return Promise.resolve();
    },
    fileInfo: (path) => {
      const data = files.get(path);
      if (!data) {
        return Promise.resolve(null);
      }
      return Promise.resolve({ sizeBytes: data.byteLength, modifiedAt: clock.now() });
    },
    rename: (from, to) => {
      const data = files.get(from);
      if (data) {
        files.set(to, data);
        files.delete(from);
      }
      return Promise.resolve();
    },
    createDirectory: (path) => {
      directories.add(path);
      return Promise.resolve();
    },
    listDirectory: (path) => {
      const prefix = path.endsWith('/') ? path : `${path}/`;
      // Non-recursive, like the real contract: only direct children — files, and folders whether
      // created explicitly or implied by a file below them.
      const children = new Set<string>();
      for (const key of [...files.keys(), ...directories]) {
        if (key.startsWith(prefix) && key.length > prefix.length) {
          const rest = key.slice(prefix.length);
          children.add(`${prefix}${rest.split('/')[0]}`);
        }
      }
      return Promise.resolve([...children]);
    },
    resolvePath: (...segments) => segments.join('/'),
    appDataDirectory: () => Promise.resolve('/app-data'),
    syncedDirectory: () => Promise.resolve(null),
    pickFile: () => Promise.resolve(null),
    pickDirectory: () => Promise.resolve(null),
    pickSaveLocation: () => Promise.resolve(null),
  };
}

function createFakeBiometricUnlock(): BiometricUnlockService {
  const store = new Map<string, string>();

  return {
    status: () => Promise.resolve({ isAvailable: true, label: 'Biometric unlock' }),
    has: (key) => Promise.resolve(store.has(key)),
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

function createFakeSqlDriver(): SqlDriver {
  return {
    unlock: () => Promise.resolve(),
    execute: () => Promise.resolve({ rows: [], rowsAffected: 0 }),
    close: () => Promise.resolve(),
  };
}

/** Builds a fully in-memory `Platform`. Every optional service is present only when its capability is. */
export function createFakePlatform(options: CreateFakePlatformOptions = {}): Platform {
  const capabilities: PlatformCapabilities = { ...DEFAULT_CAPABILITIES, ...options.capabilities };
  const now = options.now ?? DEFAULT_NOW;
  const systemTimezone = options.systemTimezone ?? DEFAULT_TIMEZONE;
  const locale = options.locale ?? DEFAULT_LOCALE;
  const clock = createFakeClock(now, systemTimezone);

  return {
    capabilities,
    keyValueStore: createInMemoryStore(),
    clock,
    random: createFakeRandom(),
    localization: { locale: () => locale },
    http: { instance: ky.create() },
    ...(capabilities.hasSecretVault ? { secrets: createInMemoryStore() } : {}),
    ...(capabilities.hasBiometricUnlock ? { biometricUnlock: createFakeBiometricUnlock() } : {}),
    ...(capabilities.canWriteFile ? { fileSystem: createFakeFileSystem(clock) } : {}),
    ...(capabilities.hasEncryptedSqlDriver ? { sqlDriver: createFakeSqlDriver() } : {}),
  };
}
