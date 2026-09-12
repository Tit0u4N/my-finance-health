import type { LineChartPoint } from './lineChartMath';
import { useLineChart } from './useLineChart';

export type { LineChartPoint };

export type LineChartProps = {
  readonly data: readonly LineChartPoint[];
  readonly height?: number;
  readonly color: string;
  readonly gridlineCount?: number;
};

const TOOLTIP_WIDTH = 90;

/** Interactive balance/value trend — Account detail, Investments portfolio trend, Investment
 * detail (ui-inventory.md §3). Unlike AreaChart/Donut/MiniBar/Sankey, this chart is fluid-width
 * (its panel is), so it measures itself via useLineChart's ResizeObserver instead of taking a
 * `width` prop from a caller that already knows it. */
export function LineChart({ data, height = 260, color, gridlineCount = 5 }: LineChartProps) {
  const { containerRef, width, linePath, fillPath, gridlines, points, hoverIndex, onPointerMove, onPointerLeave } =
    useLineChart({ data, height, gridlineCount });

  const hovered = hoverIndex === undefined ? undefined : points[hoverIndex];
  const hoveredPoint = hoverIndex === undefined ? undefined : data[hoverIndex];
  const tooltipLeft = hovered ? Math.min(Math.max(hovered.x - TOOLTIP_WIDTH / 2, 0), width - TOOLTIP_WIDTH) : 0;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      {width > 0 && data.length > 0 && (
        <svg
          width={width}
          height={height}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="block overflow-visible"
          aria-hidden="true"
        >
          {gridlines.map((y, index) => (
            <line
              key={y}
              x1={0}
              x2={width}
              y1={y}
              y2={y}
              stroke="var(--mfh-border)"
              strokeWidth={0.5}
              strokeDasharray={index === 0 || index === gridlines.length - 1 ? undefined : '2 4'}
              opacity={index === 0 || index === gridlines.length - 1 ? 1 : 0.6}
            />
          ))}
          <path d={fillPath} fill={color} fillOpacity={0.08} />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {hovered && (
            <>
              <line
                x1={hovered.x}
                x2={hovered.x}
                y1={0}
                y2={height}
                stroke="var(--mfh-border-strong)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={hovered.x} cy={hovered.y} r={5} fill="var(--mfh-surface)" stroke={color} strokeWidth={2} />
            </>
          )}
        </svg>
      )}
      {hovered && hoveredPoint && (
        <div
          className="pointer-events-none absolute flex w-22.5 flex-col items-center gap-0.5 rounded-sm border border-border bg-elevated px-2 py-1.5 text-center shadow-md"
          style={{ left: tooltipLeft, top: Math.max(hovered.y - 44, 0) }}
        >
          <span className="text-caption text-subtle normal-case">{hoveredPoint.label}</span>
          <span className="text-foreground text-label-strong">{hoveredPoint.valueLabel}</span>
        </div>
      )}
    </div>
  );
}
