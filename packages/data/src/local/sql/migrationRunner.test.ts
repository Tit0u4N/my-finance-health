// @repo/data — level 1.

import { isErr, isOk } from '@repo/domain/primitives/result';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import { beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from './migrationRunner';
import { createNodeSqliteTestDriver } from './nodeSqliteTestDriver';
import { SCHEMA_VERSION } from './schema';

describe('runMigrations', () => {
  let driver: SqlDriver;

  beforeEach(async () => {
    driver = createNodeSqliteTestDriver();
    await driver.unlock(':memory:', 'unused', { salt: '', memoryKiB: 1, iterations: 1, parallelism: 1 });
  });

  it('creates every entity table and reports the schema version', async () => {
    const result = await runMigrations(driver);

    expect(isOk(result) && result.value).toBe(SCHEMA_VERSION);
    const rows = await driver.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'account'");
    expect(rows.rows).toHaveLength(1);
  });

  it('sets PRAGMA user_version to the schema version', async () => {
    await runMigrations(driver);

    const result = await driver.execute('SELECT user_version AS userVersion FROM pragma_user_version()');
    const row = result.rows[0] as { readonly userVersion?: unknown } | undefined;
    expect(row?.userVersion).toBe(SCHEMA_VERSION);
  });

  it('is idempotent — running twice does not fail or duplicate tables', async () => {
    await runMigrations(driver);

    const second = await runMigrations(driver);

    expect(isOk(second)).toBe(true);
  });

  it('rejects a workspace whose schema version is newer than this app supports', async () => {
    await driver.execute('PRAGMA user_version = 999');

    const result = await runMigrations(driver);

    expect(isErr(result) && result.error.kind).toBe('integrity');
  });
});
