// @repo/data — level 1.

import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import { beforeEach, describe, expect, it } from 'vitest';
import { pointerUpsertStatement, readJournalPointer } from './journalPointer';
import { runMigrations } from './migrationRunner';
import { createNodeSqliteTestDriver } from './nodeSqliteTestDriver';

describe('journalPointer', () => {
  let driver: SqlDriver;

  beforeEach(async () => {
    driver = createNodeSqliteTestDriver();
    await driver.unlock(':memory:', 'unused', { salt: '', memoryKiB: 1, iterations: 1, parallelism: 1 });
    await runMigrations(driver);
  });

  it('returns -1 when no entry has ever been applied', async () => {
    expect(await readJournalPointer(driver)).toBe(-1);
  });

  it('reflects the sequence after an upsert', async () => {
    const [sql, params] = pointerUpsertStatement(7);
    await driver.execute(sql, params);

    expect(await readJournalPointer(driver)).toBe(7);
  });

  it('overwrites rather than duplicates on a second upsert', async () => {
    const [sql1, params1] = pointerUpsertStatement(7);
    await driver.execute(sql1, params1);
    const [sql2, params2] = pointerUpsertStatement(12);
    await driver.execute(sql2, params2);

    expect(await readJournalPointer(driver)).toBe(12);
    const rows = await driver.execute('SELECT * FROM "mfh_state"');
    expect(rows.rows).toHaveLength(1);
  });
});
