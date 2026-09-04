import { describe, expect, it } from 'vitest';
import { createTransactionInputSchema, transactionPatchSchema, transactionSchema } from './transaction';

const valid = {
  id: 't1',
  date: '2026-08-15T09:00:00.000Z',
  desc: 'Groceries run',
  amount: -4520,
  cat: 'c1',
  acc: 'a1',
  createdAt: '2026-08-15T09:00:00.000Z',
  updatedAt: '2026-08-15T09:00:00.000Z',
};

describe('transaction', () => {
  it('parses a valid record without the optional note', () => {
    expect(transactionSchema.parse(valid)).toEqual(valid);
  });

  it('accepts a positive amount for income', () => {
    expect(transactionSchema.parse({ ...valid, amount: 250_000 }).amount).toBe(250_000);
  });

  it('create input drops id and audit fields', () => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = valid;
    expect(createTransactionInputSchema.parse(rest)).toEqual(rest);
  });

  it('patch allows every field but id and audit fields', () => {
    expect(transactionPatchSchema.parse({ desc: 'Corrected label', amount: -100 })).toEqual({
      desc: 'Corrected label',
      amount: -100,
    });
  });
});
