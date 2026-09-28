import { Rect, Svg } from 'react-native-svg';
import { useColor } from '@/theme/useColor';

export type MiniBarProps = {
  readonly data: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly color: string;
};

/** Native port of @repo/ui's `MiniBar` (packages/ui/src/components/charts/MiniBar.tsx) — the
 * `StatTile` sparkline (ui-inventory-mobile.md §2), react-native-svg instead of DOM `<svg>`. */
export function MiniBar({ data, width = 80, height = 28, color }: MiniBarProps) {
  const { colors } = useColor();

  if (data.length === 0) {
    return null;
  }
  const max = Math.max(...data.map((value) => Math.abs(value)), 1);
  const barWidth = width / data.length;

  return (
    <Svg height={height} width={width}>
      {data.map((value, index) => {
        const barHeight = Math.max(2, (Math.abs(value) / max) * height);
        return (
          <Rect
            fill={value < 0 ? colors.neg : color}
            height={barHeight}
            key={index}
            opacity={index === data.length - 1 ? 1 : 0.45}
            rx={1.5}
            width={barWidth * 0.7}
            x={index * barWidth + barWidth * 0.15}
            y={height - barHeight}
          />
        );
      })}
    </Svg>
  );
}
