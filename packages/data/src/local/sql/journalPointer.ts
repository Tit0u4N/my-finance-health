// @repo/data — level 1.
// The database's pointer to the last-applied journal entry (start-roadmap.md §9), stored in the
// generic `mfh_state` table (schema.ts) so opening replays only the delta rather than the whole
// journal every time.

import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import { quoteIdent } from './sqlIdent';

const POINTER_KEY = 'journalSequence';

/** `-1` when no entry has ever been applied — matches `OperationsJournal`'s own "empty journal" sentinel. */
export async function readJournalPointer(driver: SqlDriver): Promise<number> {
  const result = await driver.execute(
    `SELECT ${quoteIdent('value')} FROM ${quoteIdent('mfh_state')} WHERE ${quoteIdent('key')} = ?`,
    [POINTER_KEY],
  );
  const row = result.rows[0] as { readonly value?: unknown } | undefined;
  const value = row?.value;
  const sequence = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(sequence) ? sequence : -1;
}

/** Folds into the same transaction as the operations it accompanies — the pointer only ever advances alongside a commit. */
export function pointerUpsertStatement(sequence: number): readonly [string, readonly unknown[]] {
  const sql = `INSERT INTO ${quoteIdent('mfh_state')} (${quoteIdent('key')}, ${quoteIdent('value')}) VALUES (?, ?) ON CONFLICT(${quoteIdent('key')}) DO UPDATE SET ${quoteIdent('value')} = excluded.${quoteIdent('value')}`;
  return [sql, [POINTER_KEY, String(sequence)]];
}
