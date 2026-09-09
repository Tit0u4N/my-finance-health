import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type EmptyStateProps = {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly subtitle?: string;
  readonly cta?: ReactNode;
};

export function EmptyState({ icon: Icon, title, subtitle, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-md px-lg py-xl text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-surface-alt text-subtle">
        <Icon size={26} />
      </div>
      <div className="text-foreground text-heading-sm">{title}</div>
      {subtitle && <div className="max-w-xs text-body-sm text-muted leading-snug">{subtitle}</div>}
      {cta}
    </div>
  );
}
