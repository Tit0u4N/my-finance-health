import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { describe, expect, it } from 'vitest';
import { daysBetween, formatRelativeDate } from './formatRelativeDate';

const today = '2026-03-15' as IsoDate;

describe('daysBetween', () => {
  it('is exact and signed', () => {
    expect(daysBetween(today, today)).toBe(0);
    expect(daysBetween(today, '2026-03-16' as IsoDate)).toBe(1);
    expect(daysBetween(today, '2026-03-14' as IsoDate)).toBe(-1);
  });
});

describe('formatRelativeDate', () => {
  it('reports today, yesterday, and tomorrow', () => {
    expect(formatRelativeDate(today, today, 'en-US')).toBe('today');
    expect(formatRelativeDate('2026-03-14' as IsoDate, today, 'en-US')).toBe('yesterday');
    expect(formatRelativeDate('2026-03-16' as IsoDate, today, 'en-US')).toBe('tomorrow');
  });

  it('reports a distance in days for less than a week', () => {
    expect(formatRelativeDate('2026-03-12' as IsoDate, today, 'en-US')).toBe('3 days ago');
  });

  it('reports a distance in weeks under a month', () => {
    expect(formatRelativeDate('2026-03-29' as IsoDate, today, 'en-US')).toBe('in 2 weeks');
  });

  it('reports a distance in months under a year', () => {
    expect(formatRelativeDate('2026-01-14' as IsoDate, today, 'en-US')).toBe('2 months ago');
  });

  it('reports a distance in years beyond that', () => {
    expect(formatRelativeDate('2027-04-19' as IsoDate, today, 'en-US')).toBe('next year');
  });
});
