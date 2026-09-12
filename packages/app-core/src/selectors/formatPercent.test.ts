import { describe, expect, it } from 'vitest';
import { formatPercent } from './formatPercent';

describe('formatPercent', () => {
  it('formats a 0..1 ratio as a rounded percentage', () => {
    expect(formatPercent(0.125, 'en-US')).toBe('13%');
  });

  it('formats a negative ratio with a leading minus', () => {
    expect(formatPercent(-0.0833, 'en-US')).toBe('-8%');
  });

  it('honors maximumFractionDigits for a finer-grained reading', () => {
    expect(formatPercent(0.125, 'en-US', { maximumFractionDigits: 1 })).toBe('12.5%');
  });

  it('can force the sign to show even on a positive ratio', () => {
    expect(formatPercent(0.05, 'en-US', { signDisplay: 'always' })).toBe('+5%');
  });

  it('zero formats as a plain 0%', () => {
    expect(formatPercent(0, 'en-US')).toBe('0%');
  });
});
