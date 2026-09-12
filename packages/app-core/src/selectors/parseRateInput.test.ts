import { RATE_SCALE } from '@repo/domain/primitives/rate';
import { describe, expect, it } from 'vitest';
import { parseRateInput } from './parseRateInput';

describe('parseRateInput', () => {
  it('parses a dot-decimal into the scaled RateToBase', () => {
    expect(parseRateInput('0.9234')).toBe(Math.round(0.9234 * RATE_SCALE));
  });

  it('accepts a comma-decimal the same way', () => {
    expect(parseRateInput('0,9234')).toBe(Math.round(0.9234 * RATE_SCALE));
  });

  it('rejects empty text without throwing', () => {
    expect(parseRateInput('')).toBeUndefined();
    expect(parseRateInput('   ')).toBeUndefined();
  });

  it('rejects non-numeric text without throwing', () => {
    expect(parseRateInput('abc')).toBeUndefined();
  });

  it('rejects zero and negative values without throwing', () => {
    expect(parseRateInput('0')).toBeUndefined();
    expect(parseRateInput('-1')).toBeUndefined();
  });
});
