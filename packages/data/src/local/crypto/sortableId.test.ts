import { createFakePlatform } from '@repo/platform/fakePlatform';
import { describe, expect, it } from 'vitest';
import { createSortableId } from './sortableId';

describe('createSortableId', () => {
  it('produces exactly 26 Crockford-base32 characters', () => {
    const platform = createFakePlatform();
    const id = createSortableId(platform.clock, platform.random);
    expect(id).toHaveLength(26);
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('orders lexicographically by time, regardless of the random suffix', () => {
    const earlier = createFakePlatform({ now: '2026-01-01T00:00:00.000Z' });
    const later = createFakePlatform({ now: '2026-01-01T00:00:00.001Z' });

    const earlierId = createSortableId(earlier.clock, earlier.random);
    const laterId = createSortableId(later.clock, later.random);

    expect(earlierId < laterId).toBe(true);
  });

  it('is unique within the same millisecond', () => {
    const platform = createFakePlatform();
    const first = createSortableId(platform.clock, platform.random);
    const second = createSortableId(platform.clock, platform.random);
    expect(first).not.toBe(second);
  });

  it('rejects an unparseable clock value', () => {
    const platform = createFakePlatform({ now: 'not-a-date' });
    expect(() => createSortableId(platform.clock, platform.random)).toThrow(/not a parseable timestamp/);
  });
});
