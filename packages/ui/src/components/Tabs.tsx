import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

export type TabItem<TValue extends string> = {
  readonly value: TValue;
  readonly label: string;
  readonly icon?: LucideIcon;
  /** Active-state color — the New transaction/recurring modal's income/expense toggle (screens.md)
   * so the active tab reads as green/red instead of the same neutral surface for both. Omit for
   * the plain neutral active state. */
  readonly tone?: 'positive' | 'negative';
};

export type TabsProps<TValue extends string> = {
  readonly value: TValue;
  readonly onValueChange: (value: TValue) => void;
  readonly items: readonly TabItem<TValue>[];
  readonly ariaLabel: string;
  readonly className?: string;
};

const TONE_ACTIVE_CLASS: Record<NonNullable<TabItem<string>['tone']>, string> = {
  positive: 'data-[active]:bg-pos-soft data-[active]:text-pos',
  negative: 'data-[active]:bg-neg-soft data-[active]:text-neg',
};

/** Income/expense toggle in the New transaction modal (ui-inventory.md §1). No `Tabs.Panel` —
 * the "panel" here is the rest of the form, not per-tab content. base-ui marks the active tab
 * with `data-active`, not `data-selected`. */
export function Tabs<TValue extends string>({ value, onValueChange, items, ariaLabel, className }: TabsProps<TValue>) {
  return (
    <BaseTabs.Root value={value} onValueChange={(next) => onValueChange(next as TValue)}>
      <BaseTabs.List
        aria-label={ariaLabel}
        className={cn('flex items-center gap-0.5 rounded-md border border-border bg-chip-bg p-0.75', className)}
      >
        {items.map((item) => (
          <BaseTabs.Tab
            key={item.value}
            value={item.value}
            className={cn(
              'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-sm px-3 text-body-sm text-muted transition-colors',
              item.tone
                ? TONE_ACTIVE_CLASS[item.tone]
                : 'data-[active]:bg-surface data-[active]:text-foreground data-[active]:shadow-xs',
            )}
          >
            {item.icon && <item.icon size={14} />}
            {item.label}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
    </BaseTabs.Root>
  );
}
