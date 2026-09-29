import { Circle, Line, Path, Svg } from 'react-native-svg';
import { useColor } from '@/theme/useColor';
import { buildFillPath, buildGridlines, buildSmoothPath, type LineChartPoint, scalePoints } from './lineChartMath';

export type { LineChartPoint };

type LineChartProps = {
  readonly data: readonly LineChartPoint[];
  readonly width: number;
  readonly height?: number;
  readonly color: string;
  readonly gridlineCount?: number;
};

/** Balance/value trend — Account detail's "Balance trend" card. Fork, not a port, of @repo/ui's
 * `LineChart`: that one measures itself with a `ResizeObserver` and carries a pointer-hover
 * crosshair + tooltip; this one takes an explicit `width` like `AreaChart`/`Donut`/`MiniBar`/
 * `Sankey` already do and ships no touch-hover interaction in this pass (dropped, not silently
 * omitted — there is no touch equivalent of a mouse hover worth hand-rolling here). */
export function LineChart({ data, width, height = 200, color, gridlineCount = 5 }: LineChartProps) {
  const { colors } = useColor();

  if (data.length === 0) {
    return null;
  }

  const points = scalePoints(data, width, height);
  const linePath = buildSmoothPath(points);
  const fillPath = buildFillPath(points, height);
  const gridlines = buildGridlines(height, gridlineCount);
  const last = points[points.length - 1];

  return (
    <Svg height={height} width={width}>
      {gridlines.map((y, index) => {
        const isEdge = index === 0 || index === gridlines.length - 1;
        return (
          <Line
            key={y}
            opacity={isEdge ? 1 : 0.6}
            stroke={colors.border}
            strokeWidth={0.5}
            x1={0}
            x2={width}
            y1={y}
            y2={y}
            {...(isEdge ? {} : { strokeDasharray: [2, 4] })}
          />
        );
      })}
      <Path d={fillPath} fill={color} fillOpacity={0.08} />
      <Path d={linePath} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      {last && <Circle cx={last.x} cy={last.y} fill={colors.surface} r={5} stroke={color} strokeWidth={2} />}
    </Svg>
  );
}
