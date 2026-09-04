import { describe, expect, it } from 'vitest';
import { exchangeRateSchema, upsertExchangeRateInputSchema } from './exchangeRate';

describe('exchangeRate', () => {
  it('parses a valid record keyed by currency, no id', () => {
    const record = { currency: 'USD', rateToBase: 923_400, updatedAt: '2026-01-01T00:00:00.000Z' };
    expect(exchangeRateSchema.parse(record)).toEqual(record);
  });

  it('rejects a non-positive rate', () => {
    expect(() =>
      exchangeRateSchema.parse({ currency: 'USD', rateToBase: 0, updatedAt: '2026-01-01T00:00:00.000Z' }),
    ).toThrow();
  });

  it('upsert input omits updatedAt', () => {
    expect(upsertExchangeRateInputSchema.parse({ currency: 'GBP', rateToBase: 1_150_000 })).toEqual({
      currency: 'GBP',
      rateToBase: 1_150_000,
    });
  });
});
