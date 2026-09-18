// @repo/data — level 1.
// A global ambient declaration file (no top-level import/export), so `declare module` here
// creates a fresh module rather than being treated as an augmentation of an already-known one —
// this package's `types: []` tsconfig means @types/node's own ambient declarations for
// `node:sqlite` are never loaded, by design (shared packages assume no particular JS runtime).
// Only the slice of the API nodeSqliteTestDriver.ts actually uses is declared.

declare module 'node:sqlite' {
  export type SqliteColumnMeta = { readonly name: string };
  export type SqliteRunResult = { readonly changes: number; readonly lastInsertRowid: number | bigint };
  export type SqliteStatement = {
    columns(): readonly SqliteColumnMeta[];
    run(...params: readonly unknown[]): SqliteRunResult;
    all(...params: readonly unknown[]): readonly Record<string, unknown>[];
  };
  export class DatabaseSync {
    constructor(location: string);
    exec(sql: string): void;
    prepare(sql: string): SqliteStatement;
    function(name: string, fn: (...args: readonly unknown[]) => unknown): void;
    close(): void;
  }
}
