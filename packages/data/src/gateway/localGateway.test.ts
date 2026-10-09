// @repo/data — level 1.
// Mirrors memoryGateway.test.ts's scenarios against a real SQLite engine (node:sqlite, via
// createNodeSqliteTestDriver) — the two gateways must agree, since app-core is entirely unaware
// of which one is active.

import type { Account } from '@repo/domain/entities/account';
import type { Category } from '@repo/domain/entities/category';
import type { ExchangeRate } from '@repo/domain/entities/exchangeRate';
import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import type { Transaction } from '@repo/domain/entities/transaction';
import type { DomainError } from '@repo/domain/primitives/errors';
import { isErr, isOk, ok, type Result } from '@repo/domain/primitives/result';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import { beforeEach, describe, expect, it } from 'vitest';
import type { JournalEntry, JournalPosition, OperationsJournal } from '../local/journal/operationsJournal';
import { runMigrations } from '../local/sql/migrationRunner';
import { createNodeSqliteTestDriver } from '../local/sql/nodeSqliteTestDriver';
import type { PersistenceGateway } from './gateway';
import { createLocalGateway } from './localGateway';

function createFakeJournal(): OperationsJournal {
  let sequence = -1;
  const entries: JournalEntry[] = [];
  return {
    get head(): JournalPosition {
      return { segmentIndex: 0, sequence };
    },
    append: (ops) => {
      sequence += 1;
      entries.push({ sequence, id: `entry-${sequence}`, dev: 'test-device', at: '2026-01-01T00:00:00.000Z', ops });
      return Promise.resolve(ok({ segmentIndex: 0, sequence }));
    },
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

const groceries = {
  id: 'c1',
  name: 'Groceries',
  color: '#22c55e',
  kind: 'expense',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as Category;

function transaction(overrides: Record<string, unknown> = {}): Transaction {
  return {
    id: 't1',
    date: '2026-03-01T09:00:00.000Z',
    desc: 'Groceries run',
    amount: -4500,
    cat: 'c1',
    acc: 'a1',
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
    ...overrides,
  } as Transaction;
}

function recurringRule(overrides: Record<string, unknown> = {}): RecurringRule {
  return {
    id: 'r1',
    desc: 'Rent',
    amount: -120_000,
    freq: 'Monthly',
    cat: 'c1',
    acc: 'a1',
    startDate: '2026-01-01',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as RecurringRule;
}

describe('createLocalGateway', () => {
  let driver: SqlDriver;
  let gateway: PersistenceGateway;

  beforeEach(async () => {
    driver = createNodeSqliteTestDriver();
    await driver.unlock(':memory:', 'unused', { salt: '', memoryKiB: 1, iterations: 1, parallelism: 1 });
    const migrated = await runMigrations(driver);
    expect(isOk(migrated)).toBe(true);
    gateway = createLocalGateway({ driver, journal: createFakeJournal() });
  });

  it('reads back a seeded record by id', async () => {
    await gateway.write('account', account);

    const result = await gateway.readById('account', 'a1');

    expect(isOk(result)).toBe(true);
    expect(isOk(result) && result.value.name).toBe('Everyday');
  });

  it('keys ExchangeRate by currency rather than id', async () => {
    const rate = { currency: 'USD', rateToBase: 923_400, updatedAt: '2026-01-01T00:00:00.000Z' } as ExchangeRate;
    await gateway.write('exchangeRate', rate);

    const result = await gateway.readById('exchangeRate', 'USD');

    expect(isOk(result)).toBe(true);
  });

  it('returns not-found for a missing id', async () => {
    const result = await gateway.readById('account', 'missing');

    expect(isErr(result)).toBe(true);
    expect(isErr(result) && result.error.kind).toBe('not-found');
  });

  it('write is visible to a subsequent read', async () => {
    const written = await gateway.write('account', account);
    expect(isOk(written)).toBe(true);

    const listed = await gateway.readCollection('account', {});

    expect(isOk(listed) && listed.value).toEqual([account]);
  });

  it('upserts on a repeated write to the same key rather than duplicating the row', async () => {
    await gateway.write('account', account);
    await gateway.write('account', { ...account, name: 'Renamed' });

    const listed = await gateway.readCollection('account', {});

    expect(isOk(listed) && listed.value).toHaveLength(1);
    expect(isOk(listed) && listed.value[0]?.name).toBe('Renamed');
  });

  it('delete removes a record', async () => {
    await gateway.write('account', account);

    await gateway.delete('account', 'a1');

    expect(isErr(await gateway.readById('account', 'a1'))).toBe(true);
  });

  it('filters a collection by account, category, amount sign, and text simultaneously', async () => {
    await gateway.batch([
      {
        kind: 'write',
        entity: 'transaction',
        record: transaction({ id: 't1', acc: 'a1', cat: 'c1', amount: -4500, desc: 'Groceries' }),
      },
      {
        kind: 'write',
        entity: 'transaction',
        record: transaction({ id: 't2', acc: 'a2', amount: -1000, desc: 'Coffee' }),
      },
      {
        kind: 'write',
        entity: 'transaction',
        record: transaction({ id: 't3', acc: 'a1', amount: 250_000, desc: 'Salary' }),
      },
    ]);

    const result = await gateway.readCollection('transaction', {
      filter: { accountIds: ['a1'], amountSign: 'negative', text: 'grocer' },
    });

    expect(isOk(result) && result.value.map((t) => t.id)).toEqual(['t1']);
  });

  it('text filter matches case- and accent-insensitively', async () => {
    await gateway.write('transaction', transaction({ id: 't1', desc: 'Café Central', note: undefined }));

    const result = await gateway.readCollection('transaction', { filter: { text: 'CAFÉ' } });

    expect(isOk(result) && result.value.map((t) => t.id)).toEqual(['t1']);
  });

  it('applies limit after the text filter, not before', async () => {
    await gateway.write('transaction', transaction({ id: 't1', desc: 'Rent', note: undefined }));
    await gateway.write('transaction', transaction({ id: 't2', desc: 'Café one', note: undefined }));
    await gateway.write('transaction', transaction({ id: 't3', desc: 'Café two', note: undefined }));

    const result = await gateway.readCollection('transaction', { filter: { text: 'café' }, limit: 1 });

    expect(isOk(result) && result.value).toHaveLength(1);
  });

  it('a filter naming a column the entity lacks excludes every row (matches memoryGateway)', async () => {
    await gateway.write('category', groceries);

    const result = await gateway.readCollection('category', { filter: { amountSign: 'positive' } });

    expect(isOk(result) && result.value).toEqual([]);
  });

  it('dateRange filter is inclusive on both bounds', async () => {
    await gateway.batch([
      { kind: 'write', entity: 'transaction', record: transaction({ id: 't1', date: '2026-03-01T00:00:00.000Z' }) },
      { kind: 'write', entity: 'transaction', record: transaction({ id: 't2', date: '2026-03-15T00:00:00.000Z' }) },
      { kind: 'write', entity: 'transaction', record: transaction({ id: 't3', date: '2026-03-31T00:00:00.000Z' }) },
    ]);

    const result = await gateway.readCollection('transaction', {
      filter: { dateRange: { start: '2026-03-01T00:00:00.000Z', end: '2026-03-15T00:00:00.000Z' } },
    });

    expect(isOk(result) && result.value.map((t) => t.id).sort()).toEqual(['t1', 't2']);
  });

  it('sorts a collection by date descending', async () => {
    await gateway.batch([
      { kind: 'write', entity: 'transaction', record: transaction({ id: 't1', date: '2026-03-01T00:00:00.000Z' }) },
      { kind: 'write', entity: 'transaction', record: transaction({ id: 't2', date: '2026-03-15T00:00:00.000Z' }) },
      { kind: 'write', entity: 'transaction', record: transaction({ id: 't3', date: '2026-03-08T00:00:00.000Z' }) },
    ]);

    const result = await gateway.readCollection('transaction', { sort: { key: 'date', direction: 'desc' } });

    expect(isOk(result) && result.value.map((t) => t.id)).toEqual(['t2', 't3', 't1']);
  });

  it('applies limit after filtering and sorting', async () => {
    await gateway.batch([
      { kind: 'write', entity: 'transaction', record: transaction({ id: 't1', date: '2026-03-01T00:00:00.000Z' }) },
      { kind: 'write', entity: 'transaction', record: transaction({ id: 't2', date: '2026-03-15T00:00:00.000Z' }) },
      { kind: 'write', entity: 'transaction', record: transaction({ id: 't3', date: '2026-03-08T00:00:00.000Z' }) },
    ]);

    const result = await gateway.readCollection('transaction', { sort: { key: 'date', direction: 'desc' }, limit: 2 });

    expect(isOk(result) && result.value.map((t) => t.id)).toEqual(['t2', 't3']);
  });

  it('round-trips a boolean column (recurringRule.active)', async () => {
    await gateway.write('recurringRule', recurringRule({ active: false }));

    const result = await gateway.readById('recurringRule', 'r1');

    expect(isOk(result) && result.value.active).toBe(false);
  });

  it('batch commits every operation atomically', async () => {
    const result = await gateway.batch([
      { kind: 'write', entity: 'account', record: account },
      { kind: 'write', entity: 'category', record: groceries },
      { kind: 'write', entity: 'transaction', record: transaction({}) },
    ]);

    expect(isOk(result)).toBe(true);
    expect(isOk(await gateway.readById('account', 'a1'))).toBe(true);
    expect(isOk(await gateway.readById('category', 'c1'))).toBe(true);
    expect(isOk(await gateway.readById('transaction', 't1'))).toBe(true);
  });

  it('batch mixing writes and deletes applies both', async () => {
    await gateway.write('account', account);

    await gateway.batch([
      { kind: 'delete', entity: 'account', id: 'a1' },
      { kind: 'write', entity: 'category', record: groceries },
    ]);

    expect(isErr(await gateway.readById('account', 'a1'))).toBe(true);
    expect(isOk(await gateway.readById('category', 'c1'))).toBe(true);
  });
});
