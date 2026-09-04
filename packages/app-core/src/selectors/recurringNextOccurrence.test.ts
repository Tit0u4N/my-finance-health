import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { describe, expect, it } from 'vitest';
import { computeNextOccurrence } from './recurringNextOccurrence';

function rule(overrides: Partial<RecurringRule>): RecurringRule {
  return {
    id: 'r1',
    desc: 'Rent',
    amount: -120_000,
    freq: 'Monthly',
    cat: 'c1',
    acc: 'a1',
    startDate: '2026-01-01',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as RecurringRule;
}

describe('computeNextOccurrence', () => {
  it('returns startDate itself when it is still in the future', () => {
    expect(computeNextOccurrence(rule({ startDate: '2026-06-01' as never }), '2026-03-15' as IsoDate)).toBe(
      '2026-06-01',
    );
  });

  it('advances monthly past today', () => {
    // Anchored Jan 1, monthly — by March 15 the next occurrence is April 1.
    expect(
      computeNextOccurrence(rule({ startDate: '2026-01-01' as never, freq: 'Monthly' }), '2026-03-15' as IsoDate),
    ).toBe('2026-04-01');
  });

  it('advances weekly past today', () => {
    expect(
      computeNextOccurrence(rule({ startDate: '2026-01-01' as never, freq: 'Weekly' }), '2026-01-10' as IsoDate),
    ).toBe('2026-01-15');
  });

  it('is today itself when today is exactly an occurrence', () => {
    expect(
      computeNextOccurrence(rule({ startDate: '2026-01-01' as never, freq: 'Monthly' }), '2026-03-01' as IsoDate),
    ).toBe('2026-03-01');
  });
});
