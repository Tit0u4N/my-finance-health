import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

const badgeVariants = cva('inline-flex items-center rounded-full font-medium leading-none', {
  variants: {
    tone: {
      neutral: 'bg-chip-bg text-muted',
      positive: 'bg-pos-soft text-pos',
      negative: 'bg-neg-soft text-neg',
      accent: 'bg-accent-soft text-accent',
    },
    size: {
      sm: 'h-5 gap-1 px-2 text-xs',
      md: 'h-6 gap-1.5 px-2.5 text-xs',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    readonly icon?: LucideIcon;
    readonly children: ReactNode;
  };

const iconSize: Record<NonNullable<BadgeProps['size']>, number> = { sm: 11, md: 12 };

/** Plain styled span, no base-ui primitive — ported near-verbatim from the mock (ui-inventory.md §1). */
export function Badge({ tone = 'neutral', size = 'md', icon: Icon, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {Icon && <Icon size={iconSize[size ?? 'md']} />}
      {children}
    </span>
  );
}
