import { useId } from 'react';
import { Circle, Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg';
import { useColor } from '@/theme/useColor';

export type AreaChartProps = {
  /** Index-ordered value samples — a decorative trend sparkline, not a precise time axis. */
  readonly data: readonly number[];
  readonly width: number;
  readonly height?: number;
  readonly color: string;
};

/** Per-account sparkline (Accounts card) — react-native-svg port of @repo/ui's `AreaChart`
 * (charts.jsx's `AreaChart`). `useId()` output contains `:`, invalid inside an SVG `url(#…)`
 * reference, so it is stripped before use as the gradient id. */
export function AreaChart({ data, width, height = 30, color }: AreaChartProps) {
  const gradientId = useId().replace(/:/g, '');
  const { colors } = useColor();

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
    <Svg height={height} width={width}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={fillPath} fill={`url(#${gradientId})`} />
      <Path d={linePath} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} />
      <Circle
        cx={lastX}
        cy={scaleY(data[data.length - 1] as number)}
        fill={color}
        r={3.5}
        stroke={colors.surface}
        strokeWidth={2}
      />
    </Svg>
  );
}
