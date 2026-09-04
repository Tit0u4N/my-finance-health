import type { Money } from '@repo/domain/primitives/money';
import { describe, expect, it } from 'vitest';
import { formatMoney } from './formatMoney';

describe('formatMoney', () => {
  it('formats minor units as a currency string', () => {
    expect(formatMoney(125_000 as Money, 'EUR', 'en-US')).toBe('€1,250.00');
  });

  it('preserves a negative sign by default', () => {
    expect(formatMoney(-4520 as Money, 'EUR', 'en-US')).toBe('-€45.20');
  });

  it('hides the sign when asked, showing the absolute value', () => {
    expect(formatMoney(-4520 as Money, 'EUR', 'en-US', { hideSign: true })).toBe('€45.20');
  });

  it('uses compact notation for card-sized displays', () => {
    expect(formatMoney(1_250_000 as Money, 'USD', 'en-US', { compact: true })).toBe('$13K');
  });
});
