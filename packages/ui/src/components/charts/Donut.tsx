export type DonutSlice = {
  readonly id: string;
  readonly value: number;
  readonly color: string;
};

export type DonutProps = {
  readonly data: readonly DonutSlice[];
  readonly size?: number;
  readonly thickness?: number;
  readonly centerLabel?: string;
  readonly centerValue?: string;
};

/** Category breakdown / allocation donut — ui-inventory.md §3, ported from `charts.jsx`. */
export function Donut({ data, size = 180, thickness = 22, centerLabel, centerValue }: DonutProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const radius = size / 2 - thickness / 2 - 2;
  const center = size / 2;

  let cursor = 0;
  const arc = (start: number, end: number) => {
    const a0 = start * Math.PI * 2 - Math.PI / 2;
    const a1 = end * Math.PI * 2 - Math.PI / 2;
    const x0 = center + radius * Math.cos(a0);
    const y0 = center + radius * Math.sin(a0);
    const x1 = center + radius * Math.cos(a1);
    const y1 = center + radius * Math.sin(a1);
    const large = end - start > 0.5 ? 1 : 0;
    return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
  };

  return (
    <svg width={size} height={size} aria-hidden="true">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--mfh-chip-bg)" strokeWidth={thickness} />
      {total > 0 &&
        data.map((slice) => {
          const start = cursor;
          cursor += slice.value / total;
          return (
            <path
              key={slice.id}
              d={arc(start + 0.004, cursor - 0.004)}
              fill="none"
              stroke={slice.color}
              strokeWidth={thickness}
              strokeLinecap="round"
            />
          );
        })}
      {centerValue !== undefined && (
        <g>
          <text
            x={center}
            y={center - 2}
            textAnchor="middle"
            fontSize="20"
            fontWeight="600"
            fill="var(--mfh-foreground)"
          >
            {centerValue}
          </text>
          {centerLabel && (
            <text x={center} y={center + 16} textAnchor="middle" fontSize="11" fill="var(--mfh-muted)">
              {centerLabel}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
