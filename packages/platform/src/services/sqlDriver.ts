// @repo/platform — level 0.
// Absent unless PlatformCapabilities.hasEncryptedSqlDriver. The contract is "unlock the
// database", not "open the database with this key" (start-roadmap.md §9): the adapter holds
// and applies the SQLCipher key, which never crosses into the core.

export type SqlQueryResult = {
  readonly rows: readonly Record<string, unknown>[];
  readonly rowsAffected: number;
};

/**
 * The KDF policy the core owns and the adapter merely executes (start-roadmap.md §9's
 * responsibility table: "key policy ... core", "actual database opening with the key ...
 * platform adapter"). The adapter derives the database key from `secret` + this spec and
 * applies it; the derived key never crosses back into the core.
 */
export type SqlKeyDerivation = {
  /** Base64-encoded, 16 bytes. */
  readonly salt: string;
  readonly memoryKiB: number;
  readonly iterations: number;
  readonly parallelism: number;
};

export type SqlDriver = {
  /** Unlocks (creating on first use) the encrypted database at `databasePath`, deriving the key from `secret` and `derivation`. */
  unlock(databasePath: string, secret: string, derivation: SqlKeyDerivation): Promise<void>;
  /**
   * Executes one statement. One obligation is part of this contract, not an implementation
   * detail: any integer outside ±2^53 must reject rather than round through JSON — no column in
   * this schema legitimately exceeds that range. (Unicode-insensitive text search is done by the
   * core in JS, never by a SQL function: not every driver can register one.)
   */
  execute(sql: string, params?: readonly unknown[]): Promise<SqlQueryResult>;
  close(): Promise<void>;
};
