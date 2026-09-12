import { describe, expect, it } from 'vitest';
import {
  buildFillPath,
  buildGridlines,
  buildSmoothPath,
  type LineChartPoint,
  nearestIndex,
  scalePoints,
} from './lineChartMath';

const POINTS: readonly LineChartPoint[] = [
  { value: 100, label: 'Day 1', valueLabel: '€100' },
  { value: 120, label: 'Day 2', valueLabel: '€120' },
  { value: 90, label: 'Day 3', valueLabel: '€90' },
];

describe('scalePoints', () => {
  it('returns one scaled point per data point, in order', () => {
    const scaled = scalePoints(POINTS, 200, 100);
    expect(scaled).toHaveLength(3);
    expect(scaled[0]?.x).toBe(4); // left padding
  });

  it('returns nothing for an empty series or an unmeasured (zero-width) container', () => {
    expect(scalePoints([], 200, 100)).toEqual([]);
    expect(scalePoints(POINTS, 0, 100)).toEqual([]);
  });
});

describe('buildSmoothPath', () => {
  it('starts with M and uses cubic (C) segments for a multi-point series', () => {
    const path = buildSmoothPath(scalePoints(POINTS, 200, 100));
    expect(path.startsWith('M')).toBe(true);
    expect(path).toContain('C');
  });

  it('is a single M with no curve for one point', () => {
    const path = buildSmoothPath(scalePoints(POINTS.slice(0, 1), 200, 100));
    expect(path.startsWith('M')).toBe(true);
    expect(path).not.toContain('C');
  });

  it('is empty for no points', () => {
    expect(buildSmoothPath([])).toBe('');
  });
});

describe('buildFillPath', () => {
  it('closes the line path down to the baseline', () => {
    const path = buildFillPath(scalePoints(POINTS, 200, 100), 100);
    expect(path).toContain('Z');
  });

  it('is empty for no points', () => {
    expect(buildFillPath([], 100)).toBe('');
  });
});

describe('buildGridlines', () => {
  it('returns the requested count, independent of measured width', () => {
    expect(buildGridlines(260, 5)).toHaveLength(5);
  });

  it('spans from the top pad to the bottom pad', () => {
    const lines = buildGridlines(100, 2);
    expect(lines[0]).toBeLessThan(lines[1] as number);
  });
});

describe('nearestIndex', () => {
  it('picks the closest point to a pointer x', () => {
    const scaled = scalePoints(POINTS, 200, 100);
    const midX = scaled[1]?.x as number;
    expect(nearestIndex(midX, scaled)).toBe(1);
    expect(nearestIndex(0, scaled)).toBe(0);
  });

  it('is undefined for an empty series', () => {
    expect(nearestIndex(50, [])).toBeUndefined();
  });
});
