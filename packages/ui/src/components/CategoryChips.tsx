import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

export type CategoryChipItem = {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly icon?: LucideIcon;
};

export type CategoryChipsProps = {
  readonly items: readonly CategoryChipItem[];
  /** Always a real selection — the caller preselects the first item of the active kind. */
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly ariaLabel: string;
};

/** Category picker inside the New transaction / New recurring rule modals (ui-inventory.md §1) —
 * a toggle-chip row over the `Category` list, filtered by the modal's income/expense tab. */
export function CategoryChips({ items, value, onChange, ariaLabel }: CategoryChipsProps) {
  return (
    <RadioGroup
      aria-label={ariaLabel}
      value={value}
      onValueChange={(next) => onChange(next as string)}
      className="flex flex-wrap gap-1.5"
    >
      {items.map((item) => (
        <Radio.Root
          key={item.id}
          value={item.id}
          className={cn(
            'flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-chip-bg px-2.5 text-body-sm text-muted transition-colors',
            'data-[checked]:bg-accent-soft data-[checked]:text-accent',
          )}
        >
          {item.icon ? (
            <item.icon size={13} />
          ) : (
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          )}
          {item.name}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
