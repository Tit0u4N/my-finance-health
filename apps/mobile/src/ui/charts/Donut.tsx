import { Circle, Path, Svg, Text as SvgText } from 'react-native-svg';
import { useColor } from '@/theme/useColor';

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

/** Native port of @repo/ui's `Donut` (packages/ui/src/components/charts/Donut.tsx) — the spending
 * breakdown / allocation donut (ui-inventory-mobile.md §2), react-native-svg instead of DOM `<svg>`. */
export function Donut({ data, size = 180, thickness = 22, centerLabel, centerValue }: DonutProps) {
  const { colors } = useColor();
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const radius = size / 2 - thickness / 2 - 2;
  const center = size / 2;

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

  let cursor = 0;

  return (
    <Svg height={size} width={size}>
      <Circle cx={center} cy={center} fill="none" r={radius} stroke={colors.chipBg} strokeWidth={thickness} />
      {total > 0 &&
        data.map((slice) => {
          const start = cursor;
          cursor += slice.value / total;
          return (
            <Path
              d={arc(start + 0.004, cursor - 0.004)}
              fill="none"
              key={slice.id}
              stroke={slice.color}
              strokeLinecap="round"
              strokeWidth={thickness}
            />
          );
        })}
      {centerValue !== undefined && (
        <>
          <SvgText
            fill={colors.foreground}
            fontSize={20}
            fontWeight="600"
            textAnchor="middle"
            x={center}
            y={center - 2}
          >
            {centerValue}
          </SvgText>
          {centerLabel && (
            <SvgText fill={colors.muted} fontSize={11} textAnchor="middle" x={center} y={center + 16}>
              {centerLabel}
            </SvgText>
          )}
        </>
      )}
    </Svg>
  );
}
