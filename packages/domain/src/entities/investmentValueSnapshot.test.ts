import { describe, expect, it } from 'vitest';
import { investmentValueSnapshotSchema, recordInvestmentValueSnapshotInputSchema } from './investmentValueSnapshot';

const valid = {
  id: 's1',
  investmentId: 'i1',
  date: '2026-08-01T00:00:00.000Z',
  price: 45_000,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('investmentValueSnapshot', () => {
  it('parses a valid record', () => {
    expect(investmentValueSnapshotSchema.parse(valid)).toEqual(valid);
  });

  it('record input drops id and audit fields', () => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = valid;
    expect(recordInvestmentValueSnapshotInputSchema.parse(rest)).toEqual(rest);
  });
});
