// @repo/platform-tauri — level 1.
// SqlDriver (@repo/platform/services/sqlDriver) implemented over the desktop shell's own Rust
// commands (apps/desktop/src-tauri/src/sql.rs) — not Tauri's official SQL plugin, which sits on
// sqlx and has no SQLCipher support (start-roadmap.md §9). The derived database key never
// crosses into this module or any other JS: only `secret` and `derivation` cross the bridge on
// `unlock`, and Rust holds the resulting key for the lifetime of the connection.

import type { SqlDriver, SqlKeyDerivation, SqlQueryResult } from '@repo/platform/services/sqlDriver';
import { invoke } from '@tauri-apps/api/core';

export function createTauriSqlDriver(): SqlDriver {
  return {
    unlock: (databasePath, secret, derivation: SqlKeyDerivation) =>
      invoke('sql_unlock', { databasePath, secret, derivation }),

    execute: (sql, params) => invoke<SqlQueryResult>('sql_execute', { sql, params }),

    close: () => invoke('sql_close'),
  };
}
