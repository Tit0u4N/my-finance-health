import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import type { LucideIcon } from 'lucide-react';

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
 * a toggle-chip row over the `Category` list, filtered by the modal's income/expense tab. Each
 * category's own color is always shown (icon tinted, or a dot when there's no icon) and carries
 * over to the checked state — a per-record hex is data, not a token, the same reasoning
 * Avatar.tsx already applies with `color-mix`. */
export function CategoryChips({ items, value, onChange, ariaLabel }: CategoryChipsProps) {
  return (
    <RadioGroup
      aria-label={ariaLabel}
      value={value}
      onValueChange={(next) => onChange(next as string)}
      className="flex flex-wrap gap-1.5"
    >
      {items.map((item) => {
        const checked = item.id === value;
        return (
          <Radio.Root
            key={item.id}
            value={item.id}
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-body-sm transition-colors"
            style={{
              background: checked ? `color-mix(in oklch, ${item.color} 14%, transparent)` : 'var(--mfh-chip-bg)',
              color: checked ? item.color : 'var(--mfh-muted)',
            }}
          >
            {item.icon ? (
              <item.icon size={13} color={checked ? item.color : undefined} />
            ) : (
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            )}
            {item.name}
          </Radio.Root>
        );
      })}
    </RadioGroup>
  );
}
