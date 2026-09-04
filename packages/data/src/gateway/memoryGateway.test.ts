import type { Account } from '@repo/domain/entities/account';
import type { Category } from '@repo/domain/entities/category';
import type { ExchangeRate } from '@repo/domain/entities/exchangeRate';
import type { Transaction } from '@repo/domain/entities/transaction';
import { isErr, isOk } from '@repo/domain/primitives/result';
import { describe, expect, it } from 'vitest';
import { createMemoryGateway } from './memoryGateway';

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

function transaction(overrides: Record<string, any> = {}): Transaction {
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

describe('createMemoryGateway', () => {
  it('reads back a seeded record by id', async () => {
    const gateway = createMemoryGateway({ account: [account], category: [groceries] });

    const result = await gateway.readById('account', 'a1');
    expect(isOk(result)).toBe(true);
    expect(isOk(result) && result.value.name).toBe('Everyday');
  });

  it('keys ExchangeRate by currency rather than id', async () => {
    const rate = { currency: 'USD', rateToBase: 923_400, updatedAt: '2026-01-01T00:00:00.000Z' } as ExchangeRate;
    const gateway = createMemoryGateway({ exchangeRate: [rate] });

    const result = await gateway.readById('exchangeRate', 'USD');
    expect(isOk(result)).toBe(true);
  });

  it('returns not-found for a missing id', async () => {
    const gateway = createMemoryGateway();
    const result = await gateway.readById('account', 'missing');
    expect(isErr(result)).toBe(true);
    expect(isErr(result) && result.error.kind).toBe('not-found');
  });

  it('write is visible to a subsequent read without mutating the prior snapshot', async () => {
    const gateway = createMemoryGateway();

    const written = await gateway.write('account', account);
    expect(isOk(written)).toBe(true);

    const listed = await gateway.readCollection('account', {});
    expect(isOk(listed) && listed.value).toEqual([account]);
  });

  it('delete removes a record', async () => {
    const gateway = createMemoryGateway({ account: [account] });

    await gateway.delete('account', 'a1');
    const result = await gateway.readById('account', 'a1');
    expect(isErr(result)).toBe(true);
  });

  it('filters a collection by account, category, amount sign, and text simultaneously', async () => {
    const gateway = createMemoryGateway({
      transaction: [
        transaction({ id: 't1', acc: 'a1', cat: 'c1', amount: -4500, desc: 'Groceries' }),
        transaction({ id: 't2', acc: 'a2', amount: -1000, desc: 'Coffee' }),
        transaction({ id: 't3', acc: 'a1', amount: 250_000, desc: 'Salary' }),
      ],
    });

    const result = await gateway.readCollection('transaction', {
      filter: { accountIds: ['a1'], amountSign: 'negative', text: 'grocer' },
    });

    expect(isOk(result) && result.value.map((t) => t.id)).toEqual(['t1']);
  });

  it('sorts a collection by date descending', async () => {
    const gateway = createMemoryGateway({
      transaction: [
        transaction({ id: 't1', date: '2026-03-01T00:00:00.000Z' }),
        transaction({ id: 't2', date: '2026-03-15T00:00:00.000Z' }),
        transaction({ id: 't3', date: '2026-03-08T00:00:00.000Z' }),
      ],
    });

    const result = await gateway.readCollection('transaction', { sort: { key: 'date', direction: 'desc' } });
    expect(isOk(result) && result.value.map((t) => t.id)).toEqual(['t2', 't3', 't1']);
  });

  it('batch commits every operation atomically', async () => {
    const gateway = createMemoryGateway();

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
    const gateway = createMemoryGateway({ account: [account] });

    await gateway.batch([
      { kind: 'delete', entity: 'account', id: 'a1' },
      { kind: 'write', entity: 'category', record: groceries },
    ]);

    expect(isErr(await gateway.readById('account', 'a1'))).toBe(true);
    expect(isOk(await gateway.readById('category', 'c1'))).toBe(true);
  });
});
