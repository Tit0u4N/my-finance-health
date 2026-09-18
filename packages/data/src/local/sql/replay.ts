// @repo/data — level 1.
// Replays unapplied journal entries into the database at opening (start-roadmap.md §9's opening
// cycle's last step before repository construction) — the delta after the database's own
// last-applied pointer, never the whole journal.

import { type DomainError, integrityError } from '@repo/domain/primitives/errors';
import { err, isErr, ok, type Result } from '@repo/domain/primitives/result';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import type { OperationsJournal } from '../journal/operationsJournal';
import { pointerUpsertStatement } from './journalPointer';
import { statementForOperation } from './statements';

export async function replayInto(
  driver: SqlDriver,
  journal: OperationsJournal,
  fromSequence: number,
): Promise<Result<true, DomainError>> {
  for await (const entryResult of journal.readEntriesAfter(fromSequence)) {
    if (isErr(entryResult)) {
      return entryResult;
    }
    const entry = entryResult.value;
    await driver.execute('BEGIN IMMEDIATE');
    try {
      for (const operation of entry.ops) {
        const [sql, params] = statementForOperation(operation);
        await driver.execute(sql, params);
      }
      const [pointerSql, pointerParams] = pointerUpsertStatement(entry.sequence);
      await driver.execute(pointerSql, pointerParams);
      await driver.execute('COMMIT');
    } catch (error) {
      await driver.execute('ROLLBACK').catch(() => undefined);
      return err(
        integrityError(`local gateway: journal replay failed at sequence ${entry.sequence} (${String(error)})`),
      );
    }
  }
  return ok(true);
}
