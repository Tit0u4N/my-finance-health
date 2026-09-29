import { describe, expect, it } from 'vitest';
import { parseAmountInput, toMinorUnits } from './moneyInput';

describe('parseAmountInput', () => {
  it('parses a dot-decimal amount', () => {
    expect(parseAmountInput('12.50')).toBe(12.5);
  });

  it('parses a comma-decimal amount', () => {
    expect(parseAmountInput('12,50')).toBe(12.5);
  });

  it('trims surrounding whitespace', () => {
    expect(parseAmountInput('  42  ')).toBe(42);
  });

  it('returns undefined for non-numeric input', () => {
    expect(parseAmountInput('abc')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(parseAmountInput('')).toBeUndefined();
  });

  // `Number('   ')` is 0 just as `Number('')` is, so a whitespace-only field must not read back as a
  // deliberate zero either — it is the same untouched input with a stray space in it.
  it('returns undefined for a whitespace-only string', () => {
    expect(parseAmountInput('   ')).toBeUndefined();
  });

  it('parses an explicit zero, which is a real amount rather than a blank field', () => {
    expect(parseAmountInput('0')).toBe(0);
  });
});

describe('toMinorUnits', () => {
  it('converts major units to rounded minor units', () => {
    expect(toMinorUnits(12.5)).toBe(1250);
  });

  it('rounds to the nearest integer', () => {
    expect(toMinorUnits(12.505)).toBe(1251);
    expect(toMinorUnits(0.001)).toBe(0);
  });

  it('handles negative amounts', () => {
    expect(toMinorUnits(-12.5)).toBe(-1250);
  });
});
