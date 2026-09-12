import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatAbsoluteDate } from './formatAbsoluteDate';

describe('formatAbsoluteDate', () => {
  it('formats a bare calendar date without the year by default', () => {
    expect(formatAbsoluteDate('2026-09-18' as IsoDate, 'en-US')).toBe('Sep 18');
  });

  it('includes the year when withYear is set', () => {
    expect(formatAbsoluteDate('2026-09-18' as IsoDate, 'en-US', { withYear: true })).toBe('Sep 18, 2026');
  });

  describe('under a host timezone west of UTC', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('does not shift the displayed day', () => {
      vi.stubEnv('TZ', 'America/New_York');
      expect(formatAbsoluteDate('2026-09-01' as IsoDate, 'en-US')).toBe('Sep 1');
    });
  });
});
