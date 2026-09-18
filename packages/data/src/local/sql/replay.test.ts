// @repo/data — level 1.

import type { Account } from '@repo/domain/entities/account';
import { type DomainError, integrityError } from '@repo/domain/primitives/errors';
import { err, isOk, ok, type Result } from '@repo/domain/primitives/result';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import { beforeEach, describe, expect, it } from 'vitest';
import type { GatewayOperation } from '../../gateway/gateway';
import type { JournalEntry, OperationsJournal } from '../journal/operationsJournal';
import { readJournalPointer } from './journalPointer';
import { runMigrations } from './migrationRunner';
import { createNodeSqliteTestDriver } from './nodeSqliteTestDriver';
import { replayInto } from './replay';

const account = {
  id: 'a1',
  name: 'Everyday',
  type: 'Checking',
  currency: 'EUR',
  balance: 100_000,
  color: '#3b82f6',
  icon: 'wallet',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as Account;

function createJournalWithEntries(entries: readonly JournalEntry[]): OperationsJournal {
  return {
    head: { segmentIndex: 0, sequence: entries.at(-1)?.sequence ?? -1 },
    append: () => Promise.reject(new Error('not used by these tests')),
    // biome-ignore lint/suspicious/useAwait: must be an async generator to satisfy AsyncGenerator; this in-memory fake needs no real await
    readEntriesAfter: async function* (after: number): AsyncGenerator<Result<JournalEntry, DomainError>> {
      for (const entry of entries) {
        if (entry.sequence > after) {
          yield ok(entry);
        }
      }
    },
    listSegments: () => Promise.resolve([]),
  };
}

describe('replayInto', () => {
  let driver: SqlDriver;

  beforeEach(async () => {
    driver = createNodeSqliteTestDriver();
    await driver.unlock(':memory:', 'unused', { salt: '', memoryKiB: 1, iterations: 1, parallelism: 1 });
    await runMigrations(driver);
  });

  it('applies every entry after the given sequence and advances the pointer', async () => {
    const ops: readonly GatewayOperation[] = [{ kind: 'write', entity: 'account', record: account }];
    const journal = createJournalWithEntries([
      { sequence: 0, id: 'e0', dev: 'd1', at: '2026-01-01T00:00:00.000Z', ops },
    ]);

    const result = await replayInto(driver, journal, -1);

    expect(isOk(result)).toBe(true);
    expect(await readJournalPointer(driver)).toBe(0);
    const rows = await driver.execute('SELECT * FROM "account" WHERE "id" = ?', ['a1']);
    expect(rows.rows).toHaveLength(1);
  });

  it('skips entries at or before the given sequence', async () => {
    const ops: readonly GatewayOperation[] = [{ kind: 'write', entity: 'account', record: account }];
    const journal = createJournalWithEntries([
      { sequence: 0, id: 'e0', dev: 'd1', at: '2026-01-01T00:00:00.000Z', ops },
    ]);

    await replayInto(driver, journal, 0);

    const rows = await driver.execute('SELECT * FROM "account"');
    expect(rows.rows).toHaveLength(0);
  });

  it('propagates a journal read error without partially applying later entries', async () => {
    const journal: OperationsJournal = {
      head: { segmentIndex: 0, sequence: 1 },
      append: () => Promise.reject(new Error('not used')),
      // biome-ignore lint/suspicious/useAwait: must be an async generator to satisfy AsyncGenerator; this in-memory fake needs no real await
      readEntriesAfter: async function* (): AsyncGenerator<Result<JournalEntry, DomainError>> {
        yield err(integrityError('corrupt entry'));
      },
      listSegments: () => Promise.resolve([]),
    };

    const result = await replayInto(driver, journal, -1);

    expect(result).toEqual(err(integrityError('corrupt entry')));
  });
});
