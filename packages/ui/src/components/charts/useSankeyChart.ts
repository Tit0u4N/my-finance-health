// @repo/ui — level 3.
// ViewModel half of Sankey.tsx (the AccountFilter.tsx/useAccountFilter.ts split) — owns the
// chart.js instance lifecycle, which a pure render function can't (canvas is imperative).

import { Chart, type ChartConfiguration, LinearScale } from 'chart.js';
import { Flow, SankeyController, type SankeyDataPoint } from 'chartjs-chart-sankey';
import { useEffect, useRef } from 'react';
import type { SankeyLink, SankeyNode } from './Sankey';

let registered = false;
function registerSankeyChart() {
  if (!registered) {
    Chart.register(LinearScale, SankeyController, Flow);
    registered = true;
  }
}

const FLOW_ALPHA = 0.28;
const NODE_WIDTH = 16;
const NODE_PADDING = 12;
const CSS_VAR_RE = /^var\((--[\w-]+)\)$/;

function resolveCssColor(value: string, el: Element): string {
  const [, cssVar] = CSS_VAR_RE.exec(value.trim()) ?? [];
  if (!cssVar) {
    return value;
  }
  return getComputedStyle(el).getPropertyValue(cssVar).trim() || value;
}

/** Canvas fillStyle understands `oklch()`/`var()` natively, but @kurkle/color — chart.js's own
 * alpha-blender, used to fade flows via the `alpha` dataset option — only parses hex/rgb/hsl. So
 * every color is round-tripped through an offscreen canvas first: set it as fillStyle, read the
 * pixel back, and hand chart.js a plain rgb() it can actually blend. */
function toRgbString(probe: CanvasRenderingContext2D, color: string): string {
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

export type UseSankeyChartOptions = {
  readonly nodes: readonly SankeyNode[];
  readonly links: readonly SankeyLink[];
};

export type UseSankeyChartResult = {
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

export function useSankeyChart({ nodes, links }: UseSankeyChartOptions): UseSankeyChartResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<'sankey', SankeyDataPoint[]> | null>(null);
  const probeRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!probeRef.current) {
      probeRef.current = document.createElement('canvas').getContext('2d');
    }
    const probe = probeRef.current;
    if (!(canvas && probe)) {
      return;
    }
    registerSankeyChart();

    const build = () => {
      const rgb = (raw: string) => toRgbString(probe, resolveCssColor(raw, canvas));
      const colorById = new Map(nodes.map((node) => [node.id, rgb(node.color)] as const));
      const foreground = rgb('var(--mfh-foreground)');

      const labels = Object.fromEntries(
        nodes.map((node) => [node.id, node.label ? `${node.label}${node.sub ? ` · ${node.sub}` : ''}` : '']),
      );
      const column = Object.fromEntries(nodes.map((node) => [node.id, node.column]));

      const config: ChartConfiguration<'sankey', SankeyDataPoint[]> = {
        type: 'sankey',
        data: {
          datasets: [
            {
              data: links.map((link) => ({ from: link.source, to: link.target, flow: link.value })),
              parsing: { from: 'from', to: 'to', flow: 'flow' },
              labels,
              column,
              colorMode: 'from',
              colorFrom: (ctx) => colorById.get(ctx.raw.from) ?? foreground,
              colorTo: (ctx) => colorById.get(ctx.raw.to) ?? foreground,
              alpha: FLOW_ALPHA,
              borderWidth: 0,
              nodeWidth: NODE_WIDTH,
              nodePadding: NODE_PADDING,
              color: foreground,
              nodeLabels: { color: foreground, padding: 8, font: { size: 12.5, weight: 540 } },
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 4 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
        },
      };

      const chart = chartRef.current;
      if (chart) {
        chart.data = config.data;
        chart.options = config.options ?? {};
        chart.update();
      } else {
        chartRef.current = new Chart(canvas, config);
      }
    };

    build();

    // `--mfh-*` colors flip under the `.dark` class on <html> (theme.css) — the resolved rgb()
    // colors baked in above need a rebuild whenever that toggles, since canvas can't just
    // re-cascade like the old SVG's `fill="var(...)"` did for free.
    const observer = new MutationObserver(build);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [nodes, links]);

  useEffect(
    () => () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    },
    [],
  );

  return { canvasRef };
}
