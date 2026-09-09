export type SankeyNode = {
  readonly id: string;
  readonly label: string;
  readonly sub?: string;
  readonly value: number;
  readonly color: string;
  /** 0-indexed left-to-right position — `computeCashflowGraph`'s shape is 3 columns (income
   * sources → total → expense/savings destinations), not the 2-column fan-out the original mock
   * drew, so this is generalized to N columns rather than a fixed `side: 'L' | 'R'`. */
  readonly column: number;
  readonly labelSide: 'left' | 'right' | 'none';
};

export type SankeyLink = {
  readonly source: string;
  readonly target: string;
  readonly value: number;
};

export type SankeyProps = {
  readonly nodes: readonly SankeyNode[];
  readonly links: readonly SankeyLink[];
  readonly width: number;
  readonly height?: number;
};

type LaidOutNode = SankeyNode & { readonly x: number; readonly y: number; readonly h: number };

const NODE_WIDTH = 16;
const GAP = 14;
const LABEL_SIZE = 12.5;
const SUB_SIZE = 11;

function layoutColumn(nodes: readonly SankeyNode[], x: number, total: number, usableHeight: number): LaidOutNode[] {
  const sum = nodes.reduce((s, n) => s + n.value, 0);
  const gap = Math.min(GAP, (usableHeight - (sum / total) * usableHeight) / Math.max(1, nodes.length - 1));
  let y = 0;
  return nodes.map((node) => {
    const h = (node.value / total) * usableHeight;
    const laid = { ...node, x, y, h };
    y += h + gap;
    return laid;
  });
}

function columnX(column: number, columnCount: number, width: number): number {
  return columnCount <= 1 ? 0 : (column / (columnCount - 1)) * (width - NODE_WIDTH);
}

/** Cashflow graph — Overview only (ui-inventory.md §3), ported from `charts.jsx` and generalized
 * from its 2-column fan-out to N columns to match `computeCashflowGraph`'s actual shape. */
export function Sankey({ nodes, links, width, height = 260 }: SankeyProps) {
  const columnCount = Math.max(...nodes.map((n) => n.column), 0) + 1;
  const byColumn = new Map<number, SankeyNode[]>();
  for (const node of nodes) {
    const list = byColumn.get(node.column) ?? [];
    list.push(node);
    byColumn.set(node.column, list);
  }

  const total = Math.max(...[...byColumn.values()].map((column) => column.reduce((s, n) => s + n.value, 0)), 1);

  const laidOut: LaidOutNode[] = [];
  for (const [column, columnNodes] of byColumn) {
    laidOut.push(...layoutColumn(columnNodes, columnX(column, columnCount, width), total, height));
  }
  const byId = new Map(laidOut.map((n) => [n.id, n]));

  const outCursor = new Map(laidOut.map((n) => [n.id, n.y]));
  const inCursor = new Map(laidOut.map((n) => [n.id, n.y]));

  const linkPaths = links
    .map((link, index) => {
      const source = byId.get(link.source);
      const target = byId.get(link.target);
      if (!(source && target)) {
        return null;
      }
      const linkHeight = (link.value / total) * height;
      const sourceY = outCursor.get(source.id) ?? source.y;
      const targetY = inCursor.get(target.id) ?? target.y;
      outCursor.set(source.id, sourceY + linkHeight);
      inCursor.set(target.id, targetY + linkHeight);
      const x0 = source.x + NODE_WIDTH;
      const x1 = target.x;
      const xm = (x0 + x1) / 2;
      const d = `M ${x0} ${sourceY} C ${xm} ${sourceY}, ${xm} ${targetY}, ${x1} ${targetY} L ${x1} ${targetY + linkHeight} C ${xm} ${targetY + linkHeight}, ${xm} ${sourceY + linkHeight}, ${x0} ${sourceY + linkHeight} Z`;
      return { d, color: source.color, key: `${link.source}-${link.target}-${index}` };
    })
    .filter((link): link is NonNullable<typeof link> => link !== null);

  return (
    <svg width={width} height={height} style={{ display: 'block' }} aria-hidden="true">
      {linkPaths.map((link) => (
        <path key={link.key} d={link.d} fill={link.color} opacity={0.22} />
      ))}
      {laidOut.map((node) => (
        <rect key={node.id} x={node.x} y={node.y} width={NODE_WIDTH} height={node.h} rx={3} fill={node.color} />
      ))}
      {laidOut.map(
        (node) =>
          node.labelSide !== 'none' &&
          node.h >= LABEL_SIZE + 7 && (
            <g key={`label-${node.id}`}>
              <text
                x={node.labelSide === 'right' ? node.x + NODE_WIDTH + 8 : node.x - 8}
                y={node.y + node.h / 2 + 3}
                fontSize={LABEL_SIZE}
                fontWeight={540}
                fill="var(--mfh-foreground)"
                textAnchor={node.labelSide === 'right' ? 'start' : 'end'}
              >
                {node.label}
              </text>
              {node.h >= LABEL_SIZE * 2.9 && node.sub && (
                <text
                  x={node.labelSide === 'right' ? node.x + NODE_WIDTH + 8 : node.x - 8}
                  y={node.y + node.h / 2 + SUB_SIZE + 7}
                  fontSize={SUB_SIZE}
                  fill="var(--mfh-muted)"
                  textAnchor={node.labelSide === 'right' ? 'start' : 'end'}
                >
                  {node.sub}
                </text>
              )}
            </g>
          ),
      )}
    </svg>
  );
}
