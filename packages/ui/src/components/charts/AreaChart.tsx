import { useId } from 'react';

export type AreaChartProps = {
  /** Index-ordered value samples — a decorative trend sparkline, not a precise time axis. */
  readonly data: readonly number[];
  readonly width: number;
  readonly height?: number;
  readonly color: string;
};

/** Per-account sparkline (Overview, Accounts card) — ui-inventory.md §3, ported from `charts.jsx`. */
export function AreaChart({ data, width, height = 30, color }: AreaChartProps) {
  const gradientId = useId();
  if (data.length === 0) {
    return null;
  }

  const padX = 4;
  const padTop = 6;
  const padBottom = 6;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padTop - padBottom;
  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;
  const span = max - min || 1;
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0;
  const scaleX = (index: number) => padX + index * stepX;
  const scaleY = (value: number) => padTop + innerHeight - ((value - min) / span) * innerHeight;

  const linePath = data.map((value, index) => `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(value)}`).join(' ');
  const lastX = scaleX(data.length - 1);
  const fillPath = `${linePath} L ${lastX} ${padTop + innerHeight} L ${padX} ${padTop + innerHeight} Z`;

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={lastX}
        cy={scaleY(data[data.length - 1] as number)}
        r="3.5"
        fill={color}
        stroke="var(--mfh-surface)"
        strokeWidth="2"
      />
    </svg>
  );
}
