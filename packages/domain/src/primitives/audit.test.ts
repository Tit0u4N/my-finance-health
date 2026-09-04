import { describe, expect, it } from 'vitest';
import { auditFieldsSchema } from './audit';

describe('audit', () => {
  it('accepts createdAt/updatedAt as full instants', () => {
    const fields = auditFieldsSchema.parse({
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    expect(fields.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects a missing updatedAt', () => {
    expect(() => auditFieldsSchema.parse({ createdAt: '2026-01-01T00:00:00.000Z' })).toThrow();
  });
});
