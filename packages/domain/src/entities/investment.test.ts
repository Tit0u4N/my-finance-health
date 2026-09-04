import { describe, expect, it } from 'vitest';
import { createInvestmentInputSchema, investmentPatchSchema, investmentSchema } from './investment';

const valid = {
  id: 'i1',
  name: 'World ETF (CW8)',
  ticker: 'CW8',
  qty: 12.5,
  avg: 42_000,
  current: 45_000,
  color: '#6366f1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('investment', () => {
  it('parses a valid record, allowing a fractional qty', () => {
    expect(investmentSchema.parse(valid)).toEqual(valid);
  });

  it('rejects a non-positive qty', () => {
    expect(() => investmentSchema.parse({ ...valid, qty: 0 })).toThrow();
  });

  it('create input drops id and audit fields', () => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = valid;
    expect(createInvestmentInputSchema.parse(rest)).toEqual(rest);
  });

  it('patch excludes current, which only moves through a recorded snapshot', () => {
    expect(() => investmentPatchSchema.parse({ current: 50_000 })).toThrow();
    expect(investmentPatchSchema.parse({ avg: 43_000 })).toEqual({ avg: 43_000 });
  });
});
