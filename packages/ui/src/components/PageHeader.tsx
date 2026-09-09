import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

export type PageHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly eyebrow?: string;
  readonly actions?: ReactNode;
  readonly back?: () => void;
};

/** Sticky page header — every screen (ui-inventory.md §2). */
export function PageHeader({ title, subtitle, eyebrow, actions, back }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-20 flex h-17 flex-shrink-0 items-center gap-4 border-border border-b bg-background/95 px-8 backdrop-blur-md">
      {back && (
        <button
          type="button"
          onClick={back}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-foreground"
        >
          <ChevronLeft size={16} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="text-caption text-subtle normal-case">{eyebrow}</div>}
        <h1 className="truncate text-foreground text-heading leading-tight">{title}</h1>
        {subtitle && <div className="mt-0.5 text-body-sm text-muted">{subtitle}</div>}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
    </div>
  );
}
