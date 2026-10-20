// @repo/platform-expo — level 1.
// SqlDriver on expo-sqlite built with SQLCipher (`useSQLCipher` in app.json's expo-sqlite plugin).
// A workspace file must open on desktop and mobile alike, so this mirrors
// apps/desktop/src-tauri/src/sql.rs step for step: Argon2id (v0x13, 32 bytes, salt/cost from the
// descriptor) → raw hex key as the very first statement → a probe read that fails on a wrong
// passphrase → rollback-journal mode (a single file, never WAL) → `cipher_integrity_check`. No
// cipher pragma is touched, so SQLCipher 4's defaults apply on both sides. The derived key never
// leaves this module (start-roadmap.md §9: "unlock the database", not "open it with this key").

import type { SqlDriver, SqlKeyDerivation, SqlQueryResult } from '@repo/platform/services/sqlDriver';
import { Directory, File, Paths } from 'expo-file-system';
import { openDatabaseAsync, type SQLiteBindValue, type SQLiteDatabase } from 'expo-sqlite';
import { type DeriveKey, deriveInScript } from './argon2Script';
import { decodeBase64, encodeBase64, toHex } from './base64';
import { type CloudContainer, cloudRelativePath, isCloudPath } from './cloudContainer';

const KEY_LENGTH = 32;
const BUSY_TIMEOUT_MS = 5000;

type BlobValue = { readonly b64: string };

function isBlob(value: unknown): value is BlobValue {
  return typeof value === 'object' && value !== null && typeof (value as { b64?: unknown }).b64 === 'string';
}

function toBindValue(value: unknown): SQLiteBindValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      throw new Error(`sql: integer ${value} is outside ±2^53 and would not round-trip`);
    }
    if (!Number.isFinite(value)) {
      throw new Error('sql: a non-finite number cannot be stored');
    }
    return value;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (isBlob(value)) {
    return decodeBase64(value.b64);
  }
  throw new Error(`sql: unsupported parameter type "${typeof value}"`);
}

function fromColumnValue(value: unknown): unknown {
  if (typeof value === 'number' && Number.isInteger(value) && !Number.isSafeInteger(value)) {
    throw new Error(`sql: integer ${value} is outside ±2^53 and was not read back exactly`);
  }
  return value instanceof Uint8Array ? { b64: encodeBase64(value) } : value;
}

function fromRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([column, value]) => [column, fromColumnValue(value)]));
}

/** The database's File, from a sandbox-relative or `cloud:` path (fileSystem.ts's path spaces). A
 * cloud database is downloaded first if iCloud evicted it: SQLite must find real bytes on disk. */
async function databaseFile(databasePath: string, cloud: CloudContainer | undefined): Promise<File> {
  if (!isCloudPath(databasePath)) {
    return new File(Paths.document, databasePath);
  }
  const root = cloud ? await cloud.documentsDirectory() : null;
  if (root === null || !cloud) {
    throw new Error('iCloud Drive is not available on this device right now');
  }
  const file = new File(new Directory(root), cloudRelativePath(databasePath));
  await cloud.ensureDownloaded(file.uri);
  return file;
}

/** The plain filesystem directory and file name SQLite needs. */
function locateDatabase(file: File): { readonly directory: string; readonly name: string } {
  const directoryUri = file.parentDirectory.uri.replace(/\/$/, '');
  return { directory: decodeURIComponent(directoryUri.replace(/^file:\/\//, '')), name: file.name };
}

export type ExpoSqlDriverOptions = {
  /** Replaces the Argon2id engine — same bytes out. The app supplies a native one (it cannot live
   * in this package: native Argon2 libraries are React Native modules). */
  readonly deriveKey?: DeriveKey;
  /** Same primitives as the file system's, so `cloud:` databases open in place. */
  readonly cloud?: CloudContainer;
};

export function createExpoSqlDriver({ deriveKey = deriveInScript, cloud }: ExpoSqlDriverOptions = {}): SqlDriver {
  let database: SQLiteDatabase | null = null;

  async function closeCurrent(): Promise<void> {
    const open = database;
    database = null;
    await open?.closeAsync();
  }

  function requireOpen(): SQLiteDatabase {
    if (!database) {
      throw new Error('sql: no database is unlocked');
    }
    return database;
  }

  async function deriveKeyHex(secret: string, derivation: SqlKeyDerivation): Promise<string> {
    return toHex(await deriveKey(secret, decodeBase64(derivation.salt), derivation, KEY_LENGTH));
  }

  return {
    unlock: async (databasePath, secret, derivation) => {
      await closeCurrent();
      const keyHex = await deriveKeyHex(secret, derivation);
      const { directory, name } = locateDatabase(await databaseFile(databasePath, cloud));
      const opened = await openDatabaseAsync(name, undefined, directory);
      try {
        await opened.execAsync(`PRAGMA key = "x'${keyHex}'";`);
        try {
          await opened.getFirstAsync('SELECT count(*) FROM sqlite_schema');
        } catch {
          throw new Error('wrong passphrase, or the file is not a workspace database');
        }
        await opened.execAsync(`PRAGMA journal_mode = DELETE; PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS};`);
        const problems = await opened.getAllAsync('PRAGMA cipher_integrity_check');
        if (problems.length > 0) {
          throw new Error('integrity check failed: the database file is damaged');
        }
      } catch (error) {
        await opened.closeAsync();
        throw error;
      }
      database = opened;
    },

    execute: async (sql, params = []): Promise<SqlQueryResult> => {
      const statement = await requireOpen().prepareAsync(sql);
      try {
        const result = await statement.executeAsync<Record<string, unknown>>(params.map(toBindValue));
        const columns = await statement.getColumnNamesAsync();
        if (columns.length === 0) {
          return { rows: [], rowsAffected: result.changes };
        }
        const rows = await result.getAllAsync();
        return { rows: rows.map(fromRow), rowsAffected: 0 };
      } finally {
        await statement.finalizeAsync();
      }
    },

    close: closeCurrent,
  };
}
