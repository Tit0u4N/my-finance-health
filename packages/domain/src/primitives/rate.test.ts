import { describe, expect, it } from 'vitest';
import { toMoney } from './money';
import { convertToBase, RATE_SCALE, rateFromDecimal, rateToDecimal } from './rate';

describe('rate', () => {
  it('round-trips a decimal through the fixed-point representation', () => {
    const rate = rateFromDecimal(0.9234);

    expect(rate).toBe(923_400);
    expect(rateToDecimal(rate)).toBeCloseTo(0.9234, 6);
  });

  it('is identity for an amount already in the base currency', () => {
    const amount = toMoney(1000);
    expect(convertToBase(amount, undefined)).toBe(amount);
  });

  it('converts an amount into the base currency', () => {
    const oneToOne = rateFromDecimal(1);
    expect(oneToOne).toBe(RATE_SCALE);
    expect(convertToBase(toMoney(1000), oneToOne)).toBe(1000);

    const rate = rateFromDecimal(0.5);
    expect(convertToBase(toMoney(1000), rate)).toBe(500);
  });
});
