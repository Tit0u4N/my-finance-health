// @repo/platform — level 0.
// Absent unless PlatformCapabilities.hasEncryptedSqlDriver. The contract is "unlock the
// database", not "open the database with this key" (start-roadmap.md §9): the adapter holds
// and applies the SQLCipher key, which never crosses into the core. Full local-mode wiring
// (schema, migrations, journal replay) lands in step 8 — this type only reserves the shape.

export type SqlQueryResult = {
  readonly rows: readonly Record<string, unknown>[];
  readonly rowsAffected: number;
};

export type SqlDriver = {
  /** Unlocks (creating on first use) the encrypted database at `databasePath` with the given secret. */
  unlock(databasePath: string, secret: string): Promise<void>;
  execute(sql: string, params?: readonly unknown[]): Promise<SqlQueryResult>;
  close(): Promise<void>;
};
