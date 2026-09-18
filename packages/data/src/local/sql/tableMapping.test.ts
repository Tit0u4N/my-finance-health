// @repo/data — level 1.

import type { Account } from '@repo/domain/entities/account';
import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import { isErr, isOk } from '@repo/domain/primitives/result';
import { describe, expect, it } from 'vitest';
import { TABLE_MAPPINGS } from './tableMapping';

describe('TABLE_MAPPINGS', () => {
  it('round-trips an account with an optional field present', () => {
    const account = {
      id: 'a1',
      name: 'Everyday',
      type: 'Checking',
      currency: 'EUR',
      balance: 100_000,
      color: '#3b82f6',
      icon: 'wallet',
      last4: '1234',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as Account;

    const row = TABLE_MAPPINGS.account.toRow(account);
    const parsed = TABLE_MAPPINGS.account.fromRow(row);

    expect(isOk(parsed) && parsed.value).toEqual(account);
  });

  it('round-trips an account with an optional field absent (stored as NULL)', () => {
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

    const row = TABLE_MAPPINGS.account.toRow(account);
    expect((row as { readonly last4?: unknown }).last4).toBeNull();

    const parsed = TABLE_MAPPINGS.account.fromRow(row);
    expect(isOk(parsed) && parsed.value).toEqual(account);
  });

  it('round-trips a boolean column through its 0/1 SQL representation', () => {
    const rule = {
      id: 'r1',
      desc: 'Rent',
      amount: -120_000,
      freq: 'Monthly',
      cat: 'c1',
      acc: 'a1',
      startDate: '2026-01-01',
      active: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as RecurringRule;

    const row = TABLE_MAPPINGS.recurringRule.toRow(rule);
    expect((row as { readonly active?: unknown }).active).toBe(0);

    const parsed = TABLE_MAPPINGS.recurringRule.fromRow(row);
    expect(isOk(parsed) && (parsed.value as RecurringRule).active).toBe(false);
  });

  it('reports an integrity error for a row that fails schema validation', () => {
    const parsed = TABLE_MAPPINGS.account.fromRow({ id: 'a1' });

    expect(isErr(parsed) && parsed.error.kind).toBe('integrity');
  });

  it('keys exchangeRate on currency, not id', () => {
    expect(TABLE_MAPPINGS.exchangeRate.keyColumn).toBe('currency');
  });
});
