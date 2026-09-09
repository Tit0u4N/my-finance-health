import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type TdProps = {
  readonly children: ReactNode;
  readonly align?: 'left' | 'right';
  readonly mono?: boolean;
  readonly strong?: boolean;
  readonly muted?: boolean;
  readonly nowrap?: boolean;
};

export function Td({ children, align = 'left', mono = false, strong = false, muted = false, nowrap = true }: TdProps) {
  return (
    <td
      className={cn(
        'border-border border-b px-3.5 text-body-sm',
        strong ? 'font-medium text-foreground' : muted ? 'text-muted' : 'text-foreground',
        mono && 'tabular-nums',
        nowrap && 'whitespace-nowrap',
      )}
      style={{ textAlign: align }}
    >
      {children}
    </td>
  );
}
