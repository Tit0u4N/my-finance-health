import { describe, expect, it } from 'vitest';
import { accountPatchSchema, accountSchema, createAccountInputSchema } from './account';

const valid = {
  id: 'a1',
  name: 'Everyday',
  type: 'Checking',
  currency: 'EUR',
  balance: 125_000,
  color: '#3b82f6',
  icon: 'wallet',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('account', () => {
  it('parses a valid record without the optional last4', () => {
    expect(accountSchema.parse(valid)).toEqual(valid);
  });

  it('accepts an optional last4', () => {
    const withLast4 = { ...valid, last4: '4242' };
    expect(accountSchema.parse(withLast4).last4).toBe('4242');
  });

  it('rejects a malformed color', () => {
    expect(() => accountSchema.parse({ ...valid, color: 'blue' })).toThrow();
  });

  it('create input carries an opening balance but no id or audit fields', () => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = valid;
    expect(createAccountInputSchema.parse(rest)).toEqual(rest);
  });

  it('patch excludes balance, which only moves through a transaction', () => {
    expect(() => accountPatchSchema.parse({ balance: 0 })).toThrow();
    expect(accountPatchSchema.parse({ name: 'Renamed' })).toEqual({ name: 'Renamed' });
  });
});
