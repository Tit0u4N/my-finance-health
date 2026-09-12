import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

export type OptionGridItem<TValue extends string> = {
  readonly value: TValue;
  readonly label: string;
  readonly icon?: LucideIcon;
  /** A large glyph line instead of an icon — the mock's currency tiles (`€`/`$`/`£`). */
  readonly glyph?: string;
  readonly disabled?: boolean;
};

export type OptionGridProps<TValue extends string> = {
  readonly value: TValue;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly OptionGridItem<TValue>[];
  readonly columns: 2 | 3;
  readonly ariaLabel: string;
};

const COLUMNS_CLASS: Record<2 | 3, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};

/** Single-select icon/label tile grid — Settings → Preferences (theme, sidebar, currency),
 * onboarding step 1 (ui-inventory.md §2). base-ui `RadioGroup`/`Radio` give roving focus and
 * `aria-checked` for free, in place of the mock's plain `onClick` buttons. */
export function OptionGrid<TValue extends string>({
  value,
  onChange,
  options,
  columns,
  ariaLabel,
}: OptionGridProps<TValue>) {
  return (
    <RadioGroup
      aria-label={ariaLabel}
      value={value}
      onValueChange={(next) => onChange(next as TValue)}
      className={cn('grid gap-sm', COLUMNS_CLASS[columns])}
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          disabled={option.disabled ?? false}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-border bg-surface-alt px-2 py-3.5 text-center text-foreground text-label transition-colors',
            'data-[checked]:border-accent data-[checked]:bg-accent-soft data-[checked]:text-accent',
            'disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          {option.icon && <option.icon size={18} />}
          {option.glyph && <span className="text-heading">{option.glyph}</span>}
          <span>{option.label}</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
