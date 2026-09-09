export type MiniBarProps = {
  readonly data: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly color: string;
};

/** `StatTile` sparkline — Overview income/spending KPIs (ui-inventory.md §3), ported from `charts.jsx`. */
export function MiniBar({ data, width = 80, height = 28, color }: MiniBarProps) {
  if (data.length === 0) {
    return null;
  }
  const max = Math.max(...data.map((value) => Math.abs(value)), 1);
  const barWidth = width / data.length;

  return (
    <svg width={width} height={height} aria-hidden="true">
      {data.map((value, index) => {
        const barHeight = Math.max(2, (Math.abs(value) / max) * height);
        return (
          <rect
            key={`${index}-${value}`}
            x={index * barWidth + barWidth * 0.15}
            y={height - barHeight}
            width={barWidth * 0.7}
            height={barHeight}
            rx={1.5}
            fill={value < 0 ? 'var(--mfh-neg)' : color}
            opacity={index === data.length - 1 ? 1 : 0.45}
          />
        );
      })}
    </svg>
  );
}
