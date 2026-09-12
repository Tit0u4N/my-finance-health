import { rateFromDecimal } from '@repo/domain/primitives/rate';
import { describe, expect, it } from 'vitest';
import { formatRate } from './formatRate';

describe('formatRate', () => {
  it('formats a rate with a period decimal separator in en-US', () => {
    expect(formatRate(rateFromDecimal(0.9234), 'en-US')).toBe('0.9234');
  });

  it('formats the same rate with a comma decimal separator in fr-FR', () => {
    expect(formatRate(rateFromDecimal(0.9234), 'fr-FR')).toBe('0,9234');
  });

  it('never shows more than 6 fraction digits, the storage precision', () => {
    expect(formatRate(rateFromDecimal(1.234_567), 'en-US')).toBe('1.234567');
  });
});
