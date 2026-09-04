import { describe, expect, it } from 'vitest';
import { compareIsoDate, compareIsoDateTime, isoDateSchema, isoDateTimeSchema, timezoneSchema } from './dateTime';

describe('dateTime', () => {
  it('accepts a calendar date and rejects a datetime in its place', () => {
    expect(isoDateSchema.parse('2026-08-31')).toBe('2026-08-31');
    expect(() => isoDateSchema.parse('2026-08-31T10:00:00Z')).toThrow();
  });

  it('requires an explicit offset on a datetime', () => {
    expect(isoDateTimeSchema.parse('2026-08-31T10:00:00.000Z')).toBe('2026-08-31T10:00:00.000Z');
    expect(() => isoDateTimeSchema.parse('2026-08-31T10:00:00.000')).toThrow();
  });

  it('accepts an IANA-shaped timezone string', () => {
    expect(timezoneSchema.parse('Europe/Paris')).toBe('Europe/Paris');
  });

  it('compares chronologically', () => {
    const earlier = isoDateSchema.parse('2026-01-01');
    const later = isoDateSchema.parse('2026-02-01');
    expect(compareIsoDate(earlier, later)).toBeLessThan(0);
    expect(compareIsoDate(later, earlier)).toBeGreaterThan(0);
    expect(compareIsoDate(earlier, earlier)).toBe(0);

    const t1 = isoDateTimeSchema.parse('2026-01-01T00:00:00.000Z');
    const t2 = isoDateTimeSchema.parse('2026-01-01T01:00:00.000Z');
    expect(compareIsoDateTime(t1, t2)).toBeLessThan(0);
  });
});
