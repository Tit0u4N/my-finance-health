import { describe, expect, it } from 'vitest';
import { buildFillPath, buildGridlines, buildSmoothPath, type LineChartPoint, scalePoints } from './lineChartMath';

const POINTS: readonly LineChartPoint[] = [
  { label: 'Day 1', value: 100, valueLabel: '€100' },
  { label: 'Day 2', value: 120, valueLabel: '€120' },
  { label: 'Day 3', value: 90, valueLabel: '€90' },
];

describe('scalePoints', () => {
  it('returns one scaled point per data point, in order', () => {
    const scaled = scalePoints(POINTS, 200, 100);
    expect(scaled).toHaveLength(3);
    expect(scaled[0]?.x).toBe(4); // left padding
  });

  it('returns nothing for an empty series or an unmeasured (zero-width/height) chart', () => {
    expect(scalePoints([], 200, 100)).toEqual([]);
    expect(scalePoints(POINTS, 0, 100)).toEqual([]);
    expect(scalePoints(POINTS, 200, 0)).toEqual([]);
  });

  it('never produces NaN for a flat series (span-or-1 guard)', () => {
    const flat: readonly LineChartPoint[] = [
      { label: 'a', value: 50, valueLabel: '€50' },
      { label: 'b', value: 50, valueLabel: '€50' },
    ];
    const scaled = scalePoints(flat, 200, 100);
    expect(scaled.every((point) => Number.isFinite(point.y))).toBe(true);
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
  it('returns the requested count', () => {
    expect(buildGridlines(260, 5)).toHaveLength(5);
  });

  it('spans from the top pad to the bottom pad', () => {
    const lines = buildGridlines(100, 2);
    expect(lines[0]).toBeLessThan(lines[1] as number);
  });

  it('is empty for a non-positive count or height', () => {
    expect(buildGridlines(100, 0)).toEqual([]);
    expect(buildGridlines(0, 5)).toEqual([]);
  });
});
