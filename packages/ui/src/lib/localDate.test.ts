import { describe, expect, it } from 'vitest';
import { toIsoDate, toLocalDate } from './localDate';

describe('toLocalDate', () => {
  it('parses an ISO date into a local-time Date at midnight', () => {
    const date = toLocalDate('2026-09-13');

    expect(date).toBeInstanceOf(Date);
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(8);
    expect(date?.getDate()).toBe(13);
    expect(date?.getHours()).toBe(0);
  });

  it('round-trips across a DST spring-forward boundary (Europe, late March)', () => {
    const date = toLocalDate('2026-03-29');

    expect(date).toBeDefined();
    expect(date && toIsoDate(date)).toBe('2026-03-29');
  });

  it('returns undefined for an empty string', () => {
    expect(toLocalDate('')).toBeUndefined();
  });

  it('returns undefined for a malformed string', () => {
    expect(toLocalDate('13/09/2026')).toBeUndefined();
    expect(toLocalDate('2026-9-3')).toBeUndefined();
    expect(toLocalDate('not-a-date')).toBeUndefined();
  });

  it('returns undefined for a calendar date that does not exist', () => {
    expect(toLocalDate('2026-02-30')).toBeUndefined();
    expect(toLocalDate('2026-13-01')).toBeUndefined();
  });
});

describe('toIsoDate', () => {
  it('formats a local Date as a zero-padded YYYY-MM-DD string', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('round-trips through toLocalDate', () => {
    const iso = '2026-09-13';
    const date = toLocalDate(iso);

    expect(date && toIsoDate(date)).toBe(iso);
  });
});
