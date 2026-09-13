import { useSankeyChart } from './useSankeyChart';

export type SankeyNode = {
  readonly id: string;
  readonly label: string;
  readonly sub?: string;
  readonly value: number;
  readonly color: string;
  /** 0-indexed left-to-right position — `computeCashflowGraph`'s shape is income sources (0) →
   * total (1) → expense/savings destinations (2). Passed straight through to chartjs-chart-sankey's
   * `column` option so the three columns stay fixed regardless of graph topology. */
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
  readonly width: number;
  readonly height?: number;
};

/** Cashflow graph — Overview only (ui-inventory.md §3). Renders via chartjs-chart-sankey
 * (open-questions.md #14) instead of hand-rolled SVG: a real layered layout reliably reads as
 * three distinct income/neutral/outcome columns, which the previous free-form SVG did not. */
export function Sankey({ nodes, links, width, height = 260 }: SankeyProps) {
  const { canvasRef } = useSankeyChart({ nodes, links });

  return (
    <div style={{ width, height }}>
      <canvas ref={canvasRef} role="img" aria-label="Cashflow" />
    </div>
  );
}
