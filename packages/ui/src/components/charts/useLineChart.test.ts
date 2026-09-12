import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLineChart } from './useLineChart';

const DATA = [
  { value: 100, label: 'Day 1', valueLabel: '€100' },
  { value: 120, label: 'Day 2', valueLabel: '€120' },
];

describe('useLineChart', () => {
  it('starts with no measured width (jsdom never fires the ResizeObserver stub) and no hover', () => {
    const { result } = renderHook(() => useLineChart({ data: DATA, height: 260, gridlineCount: 5 }));

    expect(result.current.width).toBe(0);
    expect(result.current.points).toEqual([]);
    expect(result.current.hoverIndex).toBeUndefined();
  });

  it('still computes gridlines, since they depend only on height, not measured width', () => {
    const { result } = renderHook(() => useLineChart({ data: DATA, height: 260, gridlineCount: 5 }));

    expect(result.current.gridlines).toHaveLength(5);
  });

  it('onPointerLeave resets hoverIndex to undefined', () => {
    const { result } = renderHook(() => useLineChart({ data: DATA, height: 260, gridlineCount: 5 }));

    result.current.onPointerLeave();

    expect(result.current.hoverIndex).toBeUndefined();
  });
});
