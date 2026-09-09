import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type PanelProps = {
  readonly title?: string;
  readonly subtitle?: string;
  readonly right?: ReactNode;
  readonly children: ReactNode;
  readonly bodyClassName?: string;
  readonly className?: string;
};

/** The base card every screen uses (ui-inventory.md §2). */
export function Panel({ title, subtitle, right, children, bodyClassName, className }: PanelProps) {
  return (
    <div className={cn('flex min-w-0 flex-col rounded-lg border border-border bg-surface', className)}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-md border-border border-b px-lg pt-4 pb-3.5">
          <div className="min-w-0">
            {title && <div className="text-foreground text-label-strong">{title}</div>}
            {subtitle && <div className="mt-0.5 text-body-sm text-muted">{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      <div className={cn('min-w-0 p-lg', bodyClassName)}>{children}</div>
    </div>
  );
}
