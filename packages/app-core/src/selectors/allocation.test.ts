import type { Investment } from '@repo/domain/entities/investment';
import { describe, expect, it } from 'vitest';
import { computeAllocation } from './allocation';

function investment(id: string, qty: number, current: number): Investment {
  return {
    id,
    name: id,
    ticker: id,
    qty,
    avg: current,
    current,
    color: '#6366f1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as Investment;
}

describe('computeAllocation', () => {
  it('shares sum to 1 across positions', () => {
    const allocation = computeAllocation([investment('i1', 1, 300_000), investment('i2', 1, 100_000)]);
    expect(allocation).toEqual([
      { investmentId: 'i1', share: 0.75 },
      { investmentId: 'i2', share: 0.25 },
    ]);
  });

  it('is zero-share, not NaN, for a worthless portfolio', () => {
    expect(computeAllocation([investment('i1', 1, 0)])).toEqual([{ investmentId: 'i1', share: 0 }]);
  });
});
