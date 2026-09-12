// @repo/ui — level 3.
// ViewModel half of LineChart.tsx (the AccountFilter.tsx/useAccountFilter.ts split) — the only
// new chart that needs one, because it owns real state: measured width and hover position.

import { type PointerEvent, useEffect, useRef, useState } from 'react';
import {
  buildFillPath,
  buildGridlines,
  buildSmoothPath,
  type LineChartPoint,
  nearestIndex,
  type ScaledPoint,
  scalePoints,
} from './lineChartMath';

export type UseLineChartOptions = {
  readonly data: readonly LineChartPoint[];
  readonly height: number;
  readonly gridlineCount: number;
};

export type UseLineChartResult = {
  readonly containerRef: (node: HTMLDivElement | null) => void;
  readonly width: number;
  readonly linePath: string;
  readonly fillPath: string;
  readonly gridlines: readonly number[];
  readonly points: readonly ScaledPoint[];
  readonly hoverIndex: number | undefined;
  readonly onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  readonly onPointerLeave: () => void;
};

export function useLineChart({ data, height, gridlineCount }: UseLineChartOptions): UseLineChartResult {
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | undefined>(undefined);
  const elementRef = useRef<HTMLDivElement | null>(null);

  // The "Balance trend" panel is fluid width, unlike AreaChart/Donut which take a fixed `width`
  // prop from a caller that already knows it — the first ResizeObserver in @repo/ui.
  useEffect(() => {
    const node = elementRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  const points = scalePoints(data, width, height);

  return {
    containerRef: (node) => {
      elementRef.current = node;
    },
    width,
    linePath: buildSmoothPath(points),
    fillPath: buildFillPath(points, height),
    gridlines: buildGridlines(height, gridlineCount),
    points,
    hoverIndex,
    onPointerMove: (event) => {
      if (points.length === 0) {
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      setHoverIndex(nearestIndex(event.clientX - rect.left, points));
    },
    onPointerLeave: () => {
      setHoverIndex(undefined);
    },
  };
}
