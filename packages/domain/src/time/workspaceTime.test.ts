import { describe, expect, it } from 'vitest';
import type { IsoDate, IsoDateTime, Timezone } from '../primitives/dateTime';
import { addFrequency, rangeFor, startOfMonthIn, todayIn } from './workspaceTime';

const UTC = 'UTC' as Timezone;
const LOS_ANGELES = 'America/Los_Angeles' as Timezone;

describe('todayIn', () => {
  it('reads the date straight through in UTC', () => {
    expect(todayIn('2026-03-15T12:00:00.000Z' as IsoDateTime, UTC)).toBe('2026-03-15');
  });

  it('crosses a day (and year) boundary once shifted into a western timezone', () => {
    // 2026-01-01T02:00Z is still 2025-12-31T18:00 in America/Los_Angeles (UTC-8).
    expect(todayIn('2026-01-01T02:00:00.000Z' as IsoDateTime, LOS_ANGELES)).toBe('2025-12-31');
  });
});

describe('startOfMonthIn', () => {
  it('returns the first day of the month "now" falls in', () => {
    expect(startOfMonthIn('2026-03-15T12:00:00.000Z' as IsoDateTime, UTC)).toBe('2026-03-01');
  });
});

describe('rangeFor', () => {
  const now = '2026-03-15T00:00:00.000Z' as IsoDateTime;

  it('bounds a 7-day range', () => {
    expect(rangeFor('7d', now, UTC)).toEqual({ start: '2026-03-08', end: '2026-03-15' });
  });

  it('bounds a 1-month range', () => {
    expect(rangeFor('1m', now, UTC)).toEqual({ start: '2026-02-15', end: '2026-03-15' });
  });

  it('bounds a 1-year range', () => {
    expect(rangeFor('1y', now, UTC)).toEqual({ start: '2025-03-15', end: '2026-03-15' });
  });

  it('leaves the start unbounded for "all"', () => {
    expect(rangeFor('all', now, UTC)).toEqual({ start: undefined, end: '2026-03-15' });
  });
});

describe('addFrequency', () => {
  it('advances by one day, crossing a month boundary', () => {
    expect(addFrequency('2026-01-31' as IsoDate, 'Daily')).toBe('2026-02-01');
  });

  it('advances by one week', () => {
    expect(addFrequency('2026-01-01' as IsoDate, 'Weekly')).toBe('2026-01-08');
  });

  it('advances by one month', () => {
    expect(addFrequency('2026-01-15' as IsoDate, 'Monthly')).toBe('2026-02-15');
  });

  it('advances by one year', () => {
    expect(addFrequency('2026-02-28' as IsoDate, 'Yearly')).toBe('2027-02-28');
  });
});
