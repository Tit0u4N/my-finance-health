import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Avatar } from './Avatar';

export type StatTileProps = {
  readonly label: string;
  /** Already-rendered value node — an `AmountValue` for money, plain text otherwise. */
  readonly value: ReactNode;
  readonly sub?: string;
  readonly delta?: ReactNode | undefined;
  readonly icon?: LucideIcon | undefined;
  readonly iconColor?: string | undefined;
  readonly hero?: boolean | undefined;
  readonly spark?: ReactNode | undefined;
  readonly right?: ReactNode | undefined;
};

/** KPI tile — Overview, Transactions, Recurring, Investments, detail screens (ui-inventory.md §2). */
export function StatTile({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  iconColor,
  hero = false,
  spark,
  right,
}: StatTileProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col rounded-lg p-lg',
        hero ? 'bg-gradient-to-br from-accent to-accent-strong text-white' : 'border border-border bg-surface',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn('min-w-0 truncate text-caption', hero ? 'text-white/75' : 'text-muted')}>{label}</div>
        {right ??
          (Icon &&
            (hero ? (
              <div className="flex h-6.5 w-6.5 flex-shrink-0 items-center justify-center rounded-sm bg-white/20 text-white">
                <Icon size={14} />
              </div>
            ) : (
              <Avatar icon={Icon} color={iconColor ?? 'var(--mfh-muted)'} soft size={26} />
            )))}
      </div>
      <div className={cn('mt-3.5 truncate text-value leading-none', hero && 'text-value-hero')}>{value}</div>
      <div className="mt-2 flex min-h-5 items-center gap-2 overflow-hidden">
        {delta}
        {sub && <span className={cn('truncate text-body-sm', hero ? 'text-white/80' : 'text-muted')}>{sub}</span>}
      </div>
      {spark && <div className="mt-3">{spark}</div>}
    </div>
  );
}
