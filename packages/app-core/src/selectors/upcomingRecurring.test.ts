import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { describe, expect, it } from 'vitest';
import { computeUpcomingRecurring } from './upcomingRecurring';

function rule(id: string, overrides: Partial<RecurringRule>): RecurringRule {
  return {
    id,
    desc: id,
    amount: -1000,
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

describe('computeUpcomingRecurring', () => {
  const today = '2026-03-01' as IsoDate;

  it('excludes inactive rules and sorts by next occurrence ascending', () => {
    // Both startDates are already >= today, so each next occurrence is the startDate itself —
    // no addFrequency looping, no risk of two different frequencies landing on the same date.
    const rules = [
      rule('later', { startDate: '2026-03-20' as never }),
      rule('paused', { active: false, startDate: '2026-03-02' as never }),
      rule('sooner', { startDate: '2026-03-10' as never }),
    ];

    const upcoming = computeUpcomingRecurring(rules, today, 10);

    expect(upcoming.map((entry) => entry.rule.id)).toEqual(['sooner', 'later']);
  });

  it('caps the result to limit', () => {
    const rules = [rule('a', {}), rule('b', {}), rule('c', {})];
    expect(computeUpcomingRecurring(rules, today, 2)).toHaveLength(2);
  });
});
