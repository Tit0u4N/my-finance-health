// @repo/platform — level 0.
// The fake platform every shared-logic test runs against (start-roadmap.md §13): deterministic
// clock, counter-seeded ids, in-memory storage. No shared test starts a real adapter.

import ky from 'ky';
import type { PlatformCapabilities } from './capabilities';
import type { Platform } from './platform';
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
      const out = new Uint8Array(length);
      for (let index = 0; index < length; index += 1) {
        out[index] = (counter + index) % 256;
      }
      return out;
    },
  };
}

function createFakeFileSystem(): FileSystemService {
  const files = new Map<string, Uint8Array>();

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
    deleteFile: (path) => {
      files.delete(path);
      return Promise.resolve();
    },
    listDirectory: (path) => {
      const prefix = path.endsWith('/') ? path : `${path}/`;
      return Promise.resolve([...files.keys()].filter((key) => key.startsWith(prefix)));
    },
    resolvePath: (...segments) => segments.join('/'),
    pickFile: () => Promise.resolve(null),
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

  return {
    capabilities,
    keyValueStore: createInMemoryStore(),
    clock: createFakeClock(now, systemTimezone),
    random: createFakeRandom(),
    localization: { locale: () => locale },
    http: { instance: ky.create() },
    ...(capabilities.hasSecretVault ? { secrets: createInMemoryStore() } : {}),
    ...(capabilities.canWriteFile ? { fileSystem: createFakeFileSystem() } : {}),
    ...(capabilities.hasEncryptedSqlDriver ? { sqlDriver: createFakeSqlDriver() } : {}),
  };
}
