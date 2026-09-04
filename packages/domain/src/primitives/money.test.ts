import { describe, expect, it } from 'vitest';
import {
  addMoney,
  isNegativeMoney,
  isPositiveMoney,
  isZeroMoney,
  scaleMoney,
  subtractMoney,
  sumMoney,
  toMoney,
} from './money';

describe('money', () => {
  it('rejects non-integer amounts', () => {
    expect(() => toMoney(10.5)).toThrow();
  });

  it('classifies sign', () => {
    expect(isPositiveMoney(toMoney(100))).toBe(true);
    expect(isNegativeMoney(toMoney(-100))).toBe(true);
    expect(isZeroMoney(toMoney(0))).toBe(true);
  });

  it('adds, subtracts, and sums amounts', () => {
    expect(addMoney(toMoney(100), toMoney(-40))).toBe(60);
    expect(subtractMoney(toMoney(100), toMoney(40))).toBe(60);
    expect(sumMoney([toMoney(100), toMoney(-40), toMoney(5)])).toBe(65);
    expect(sumMoney([])).toBe(0);
  });

  it('scales and rounds to the nearest minor unit', () => {
    expect(scaleMoney(toMoney(333), 2.5)).toBe(833);
  });
});
