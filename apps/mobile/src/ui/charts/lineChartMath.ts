// Pure geometry for LineChart — duplicated from @repo/ui's `lineChartMath.ts` rather than shared,
// the same call `Sankey.tsx`/`Donut.tsx`/`MiniBar.tsx` already made: @repo/ui is level 3 (DOM),
// banned from apps/mobile by biome.json, and chart geometry is presentation, not domain logic
// (app-core-inventory.md §6's rendering-boundary rule stops app-core at plain data). No `nearestIndex`
// here — that is the DOM version's pointer-hover snap, which this pass ships no touch equivalent of.

export type LineChartPoint = {
  readonly value: number;
  /** Pre-formatted — never a raw date or number here. */
  readonly label: string;
  readonly valueLabel: string;
};

export type ScaledPoint = {
  readonly x: number;
  readonly y: number;
};

const PAD_X = 4;
const PAD_TOP = 10;
const PAD_BOTTOM = 10;

/** Maps each point's index to x and its value to y, inset by the chart's padding. A flat series
 * never touches the top/bottom edge, via the same 0.97/1.03 headroom `AreaChart` uses. */
export function scalePoints(data: readonly LineChartPoint[], width: number, height: number): readonly ScaledPoint[] {
  if (data.length === 0 || width <= 0 || height <= 0) {
    return [];
  }
  const innerWidth = Math.max(width - PAD_X * 2, 1);
  const innerHeight = Math.max(height - PAD_TOP - PAD_BOTTOM, 1);
  const values = data.map((point) => point.value);
  const min = Math.min(...values) * 0.97;
  const max = Math.max(...values) * 1.03;
  const span = max - min || 1;
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0;
  return data.map((point, index) => ({
    x: PAD_X + index * stepX,
    y: PAD_TOP + innerHeight - ((point.value - min) / span) * innerHeight,
  }));
}

/** A smooth path through `points`: cubic Bézier segments with control points at the 1/3 and 2/3
 * mark between each consecutive pair. */
export function buildSmoothPath(points: readonly ScaledPoint[]): string {
  if (points.length === 0) {
    return '';
  }
  const [first, ...rest] = points;
  if (!first || rest.length === 0) {
    return `M ${first?.x ?? 0} ${first?.y ?? 0}`;
  }
  let path = `M ${first.x} ${first.y}`;
  let previous = first;
  for (const point of rest) {
    const controlX1 = previous.x + (point.x - previous.x) / 3;
    const controlX2 = previous.x + ((point.x - previous.x) * 2) / 3;
    path += ` C ${controlX1} ${previous.y}, ${controlX2} ${point.y}, ${point.x} ${point.y}`;
    previous = point;
  }
  return path;
}

/** The line path closed down to the baseline — used for a faint area fill under the line. */
export function buildFillPath(points: readonly ScaledPoint[], height: number): string {
  if (points.length === 0) {
    return '';
  }
  const linePath = buildSmoothPath(points);
  const first = points[0] as ScaledPoint;
  const last = points[points.length - 1] as ScaledPoint;
  const baseline = height - PAD_BOTTOM;
  return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

/** Evenly spaced horizontal gridline y-positions, `count` of them, from the top pad to the bottom pad. */
export function buildGridlines(height: number, count: number): readonly number[] {
  if (count <= 0 || height <= 0) {
    return [];
  }
  if (count === 1) {
    return [PAD_TOP + (height - PAD_TOP - PAD_BOTTOM) / 2];
  }
  const innerHeight = Math.max(height - PAD_TOP - PAD_BOTTOM, 0);
  return Array.from({ length: count }, (_, index) => PAD_TOP + (innerHeight * index) / (count - 1));
}
