// @repo/data — level 1.
// Test-only SqlDriver backed by Node's built-in `node:sqlite`, so localGateway/migrationRunner
// tests run against a real SQLite engine instead of a hand-rolled fake — the same reasoning
// fakePlatform.ts gives for its own fakes: closer to production behavior than reimplementing SQL
// semantics by hand. Not encrypted (no SQLCipher here) — the encrypted-open path is covered
// separately by apps/desktop/src-tauri's own `cargo test` (start-roadmap.md §13: no shared test
// starts Tauri or a native driver).
//
// `node:sqlite` ships without ambient types under this package's `types: []` tsconfig — a
// deliberate boundary (shared packages assume no particular JS runtime) that this file doesn't
// widen; see nodeSqliteAmbient.d.ts for the (minimal) declaration this relies on.

import { DatabaseSync } from 'node:sqlite';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import type { SqlDriver, SqlQueryResult } from '@repo/platform/services/sqlDriver';

const MAX_SAFE_INTEGER = 9_007_199_254_740_991;

function guardInteger(value: number): number {
  if (Number.isInteger(value) && Math.abs(value) > MAX_SAFE_INTEGER) {
    throw new Error(`integer ${value} exceeds the safe range`);
  }
  return value;
}

/** Mirrors sql.rs's `json_to_sql`/`sql_to_json`: booleans cross as 0/1, and every integer is
 * guarded at ±2^53 — the same obligations packages/platform's SqlDriver contract places on the
 * real Rust driver. */
function bindParam(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (typeof value === 'number') {
    return guardInteger(value);
  }
  return value;
}

// Keyed by `databasePath` and never deleted on close: a real SQLCipher file survives close and
// reopen, and tests that exercise create() → close() → unlock() on the same path need the same
// in-memory data to still be there — an ordinary `:memory:` database would not survive that.
const registry = new Map<string, DatabaseSync>();

export type CreateNodeSqliteTestDriverOptions = {
  /** A real SQLCipher connection and the Tauri fs plugin both touch the same OS file, so
   * `fileSystem.fileInfo(databasePath)` sees it once unlocked. This fake's SQL registry is
   * otherwise independent of the fake file system's own file map — pass this to keep the two in
   * sync for a test that exercises the full opener flow (`open()` after `create()`, say). */
  readonly fileSystem?: FileSystemService;
};

export function createNodeSqliteTestDriver(options: CreateNodeSqliteTestDriverOptions = {}): SqlDriver {
  let db: DatabaseSync | null = null;

  return {
    unlock: async (databasePath) => {
      // Real SQLite's literal ":memory:" string never refers to a shared database — every open
      // creates a brand-new anonymous one, even with the same connection string (only a
      // `file::memory:?cache=shared` URI would share). The registry below is only for tests that
      // want persistence across a simulated close+reopen, keyed by a real-looking path.
      if (databasePath === ':memory:') {
        db = new DatabaseSync(':memory:');
        db.function('mfh_lower', (value: unknown) => (typeof value === 'string' ? value.toLowerCase() : null));
        return;
      }
      let instance = registry.get(databasePath);
      if (!instance) {
        instance = new DatabaseSync(':memory:');
        instance.function('mfh_lower', (value: unknown) => (typeof value === 'string' ? value.toLowerCase() : null));
        registry.set(databasePath, instance);
      }
      db = instance;
      if (options.fileSystem && !(await options.fileSystem.fileInfo(databasePath))) {
        await options.fileSystem.writeFile(databasePath, new Uint8Array(0));
      }
    },

    execute: (sql, params = []): Promise<SqlQueryResult> => {
      if (!db) {
        return Promise.reject(new Error('no database is open'));
      }
      const boundParams = params.map(bindParam);
      const stmt = db.prepare(sql);
      if (stmt.columns().length === 0) {
        const result = stmt.run(...boundParams);
        return Promise.resolve({ rows: [], rowsAffected: result.changes });
      }
      const rows = stmt.all(...boundParams).map((row) => {
        for (const value of Object.values(row)) {
          if (typeof value === 'number') {
            guardInteger(value);
          }
        }
        return row;
      });
      return Promise.resolve({ rows, rowsAffected: 0 });
    },

    close: () => {
      // Detaches this handle only — the registry above keeps the data alive, matching a real
      // encrypted file surviving close and a later reopen.
      db = null;
      return Promise.resolve();
    },
  };
}
