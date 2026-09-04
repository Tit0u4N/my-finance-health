import { describe, expect, it } from 'vitest';
import { createWorkspaceSettingsInputSchema, workspaceSettingsSchema } from './workspaceSettings';

const valid = {
  id: 'ws1',
  timezone: 'Europe/Paris',
  baseCurrency: 'EUR',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('workspaceSettings', () => {
  it('parses a valid record', () => {
    expect(workspaceSettingsSchema.parse(valid)).toEqual(valid);
  });

  it('rejects an unsupported currency', () => {
    expect(() => workspaceSettingsSchema.parse({ ...valid, baseCurrency: 'JPY' })).toThrow();
  });

  it('create input omits id and audit fields', () => {
    const input = createWorkspaceSettingsInputSchema.parse({ timezone: 'UTC', baseCurrency: 'USD' });
    expect(input).toEqual({ timezone: 'UTC', baseCurrency: 'USD' });
  });
});
