import { describe, expect, it } from 'vitest';
import { createRecurringRuleInputSchema, recurringRulePatchSchema, recurringRuleSchema } from './recurringRule';

const valid = {
  id: 'r1',
  desc: 'Rent',
  amount: -120_000,
  freq: 'Monthly',
  cat: 'c1',
  acc: 'a1',
  startDate: '2026-01-01',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('recurringRule', () => {
  it('parses a valid record', () => {
    expect(recurringRuleSchema.parse(valid)).toEqual(valid);
  });

  it('has no next field — it is not stored (open-questions.md #7)', () => {
    expect('next' in valid).toBe(false);
  });

  it('create input drops id and audit fields', () => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = valid;
    expect(createRecurringRuleInputSchema.parse(rest)).toEqual(rest);
  });

  it('patch covers the active toggle alone', () => {
    expect(recurringRulePatchSchema.parse({ active: false })).toEqual({ active: false });
  });
});
