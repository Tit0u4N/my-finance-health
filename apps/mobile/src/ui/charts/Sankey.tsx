import { Fragment } from 'react';
import { Path, Rect, Svg, Text as SvgText } from 'react-native-svg';
import type { Palette } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

export type SankeyNode = {
  readonly id: string;
  readonly label: string;
  readonly sub?: string;
  readonly value: number;
  readonly color: string;
  /** 0-indexed left-to-right column — `computeCashflowGraph`'s shape is income sources (0) →
   * total (1) → expense/savings destinations (2). */
  readonly column: number;
};

export type SankeyLink = {
  readonly source: string;
  readonly target: string;
  readonly value: number;
};

export type SankeyProps = {
  readonly nodes: readonly SankeyNode[];
  readonly links: readonly SankeyLink[];
  readonly width?: number;
  readonly height?: number;
};

type NodeLayout = SankeyNode & { readonly x: number; readonly y: number; readonly h: number };

const PAD_X = 6;
const PAD_Y = 6;
const NODE_WIDTH = 14;
const GAP = 10;
const LABEL_SIZE = 11;
const SUB_SIZE = 10;

/**
 * apps/desktop's Overview moved its cashflow panel to chartjs-chart-sankey (open-questions.md
 * #14) — canvas-only, no react-native-svg equivalent without pulling in a second, heavier
 * charting dependency. This ports the mock's own hand-rolled SVG algorithm instead (charts.jsx's
 * `Sankey`), generalized from its original 2-column (income/expense) layout to the 3-column
 * income → total → expense+savings shape `computeCashflowGraph` actually produces
 * (docs/spec/screens-mobile.md's Dashboard row) — flagged here since it's a real fork from the
 * desktop implementation, not a straight port.
 */
export function Sankey({ nodes, links, width = 340, height = 240 }: SankeyProps) {
  const { colors } = useColor();
  const usableH = height - PAD_Y * 2;
  const columns = groupByColumn(nodes);
  const columnCount = columns.length;
  const globalTotal = Math.max(
    ...columns.map(([, columnNodes]) => columnNodes.reduce((sum, node) => sum + node.value, 0)),
    1,
  );

  const layout = new Map<string, NodeLayout>();
  columns.forEach(([column, columnNodes]) => {
    const x = columnX(column, columnCount, width);
    layoutColumn(columnNodes, globalTotal, usableH).forEach((node) => {
      layout.set(node.id, { ...node, x });
    });
  });

  const outCursor = new Map<string, number>();
  const inCursor = new Map<string, number>();
  for (const node of layout.values()) {
    outCursor.set(node.id, node.y);
    inCursor.set(node.id, node.y);
  }

  const ribbons = links
    .map((link) => buildRibbon(link, layout, globalTotal, usableH, outCursor, inCursor))
    .filter((ribbon) => ribbon !== undefined);

  return (
    <Svg height={height} width={width}>
      {ribbons.map((ribbon) => (
        <Path d={ribbon.d} fill={ribbon.color} key={ribbon.id} opacity={0.22} />
      ))}
      {[...layout.values()].map((node) => (
        <Rect fill={node.color} height={node.h} key={node.id} rx={3} width={NODE_WIDTH} x={node.x} y={node.y} />
      ))}
      {[...layout.values()].map((node) => renderLabel(node, columnCount, colors))}
    </Svg>
  );
}

function groupByColumn(nodes: readonly SankeyNode[]): ReadonlyArray<readonly [number, readonly SankeyNode[]]> {
  const byColumn = new Map<number, SankeyNode[]>();
  for (const node of nodes) {
    const bucket = byColumn.get(node.column) ?? [];
    bucket.push(node);
    byColumn.set(node.column, bucket);
  }
  return [...byColumn.entries()].sort(([a], [b]) => a - b);
}

function columnX(column: number, columnCount: number, width: number): number {
  if (columnCount <= 1) {
    return PAD_X;
  }
  const span = width - PAD_X * 2 - NODE_WIDTH;
  return PAD_X + (column / (columnCount - 1)) * span;
}

function layoutColumn(columnNodes: readonly SankeyNode[], globalTotal: number, usableH: number): NodeLayout[] {
  const columnSum = columnNodes.reduce((sum, node) => sum + node.value, 0);
  const gap = Math.min(GAP, (usableH - (columnSum / globalTotal) * usableH) / Math.max(1, columnNodes.length - 1));
  let cursor = PAD_Y;
  return columnNodes.map((node) => {
    const h = (node.value / globalTotal) * usableH;
    const laidOut: NodeLayout = { ...node, h, x: 0, y: cursor };
    cursor += h + gap;
    return laidOut;
  });
}

function buildRibbon(
  link: SankeyLink,
  layout: ReadonlyMap<string, NodeLayout>,
  globalTotal: number,
  usableH: number,
  outCursor: Map<string, number>,
  inCursor: Map<string, number>,
): { readonly id: string; readonly d: string; readonly color: string } | undefined {
  const source = layout.get(link.source);
  const target = layout.get(link.target);
  if (!(source && target)) {
    return undefined;
  }
  const flowHeight = (link.value / globalTotal) * usableH;
  const sy0 = outCursor.get(source.id) ?? source.y;
  const ty0 = inCursor.get(target.id) ?? target.y;
  outCursor.set(source.id, sy0 + flowHeight);
  inCursor.set(target.id, ty0 + flowHeight);

  const x0 = source.x + NODE_WIDTH;
  const x1 = target.x;
  const xm = (x0 + x1) / 2;
  const d = `M ${x0} ${sy0}
    C ${xm} ${sy0}, ${xm} ${ty0}, ${x1} ${ty0}
    L ${x1} ${ty0 + flowHeight}
    C ${xm} ${ty0 + flowHeight}, ${xm} ${sy0 + flowHeight}, ${x0} ${sy0 + flowHeight} Z`;
  return { color: source.color, d, id: `${link.source}-${link.target}` };
}

function renderLabel(node: NodeLayout, columnCount: number, colors: Palette) {
  if (!node.label || node.h < LABEL_SIZE + 7) {
    return null;
  }
  const isFirstColumn = node.column === 0;
  const isLastColumn = node.column === columnCount - 1;
  const anchor = isFirstColumn ? 'start' : isLastColumn ? 'end' : 'middle';
  const x = isFirstColumn ? node.x + NODE_WIDTH + 8 : isLastColumn ? node.x - 8 : node.x + NODE_WIDTH / 2;
  const showSub = node.sub && node.h >= LABEL_SIZE * 2.9;

  return (
    <Fragment key={`label-${node.id}`}>
      <SvgText
        fill={colors.foreground}
        fontSize={LABEL_SIZE}
        fontWeight="540"
        textAnchor={anchor}
        x={x}
        y={node.y + node.h / 2 + 3}
      >
        {node.label}
      </SvgText>
      {showSub && (
        <SvgText
          fill={colors.muted}
          fontSize={SUB_SIZE}
          textAnchor={anchor}
          x={x}
          y={node.y + node.h / 2 + SUB_SIZE + 7}
        >
          {node.sub}
        </SvgText>
      )}
    </Fragment>
  );
}
