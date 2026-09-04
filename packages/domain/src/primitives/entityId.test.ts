import { describe, expect, it } from 'vitest';
import { accountIdSchema, categoryIdSchema } from './entityId';

describe('entityId', () => {
  it('accepts a non-empty string', () => {
    expect(accountIdSchema.parse('a1')).toBe('a1');
  });

  it('rejects an empty string', () => {
    expect(() => categoryIdSchema.parse('')).toThrow();
  });
});
