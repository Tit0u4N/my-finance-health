import { Select as BaseSelect } from '@base-ui-components/react/select';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

export type SelectOption<TValue extends string> = {
  readonly value: TValue;
  readonly label: string;
  readonly icon?: LucideIcon;
};

export type SelectProps<TValue extends string> = {
  readonly value: TValue;
  readonly onValueChange: (value: TValue) => void;
  readonly options: readonly SelectOption<TValue>[];
  readonly label?: string;
  /** The trigger's `role="combobox"` doesn't support name-from-content (WAI-ARIA), so its own
   * visible text never becomes its accessible name — needed whenever there's no visible `label`
   * (e.g. a compact filter bar). Falls back to `label` when omitted, so a labeled Select also
   * gets a real accessible name instead of none. */
  readonly ariaLabel?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
};

/** Base-ui-backed replacement for the mock's native `<select>` (ui-inventory.md §1: "port as a
 * base-ui Select styled to match, not a native select"). Generic over `TValue` so a caller never
 * has to widen back to `string` and lose exhaustiveness on its own union (e.g. `CurrencyCode`). */
export function Select<TValue extends string>({
  value,
  onValueChange,
  options,
  label,
  ariaLabel,
  placeholder,
  disabled,
  className,
}: SelectProps<TValue>) {
  const selected = options.find((option) => option.value === value);
  const accessibleLabel = ariaLabel ?? label;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-label text-muted">{label}</span>}
      <BaseSelect.Root
        value={value}
        onValueChange={(next) => onValueChange(next as TValue)}
        disabled={disabled ?? false}
        items={options.map((option) => ({ value: option.value, label: option.label }))}
      >
        <BaseSelect.Trigger
          {...(accessibleLabel === undefined ? {} : { 'aria-label': accessibleLabel })}
          className={cn(
            'flex h-11 w-full items-center gap-2 rounded-md border border-border bg-surface-alt px-3.5 text-body text-foreground outline-none transition-colors',
            'focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent/30',
            'disabled:pointer-events-none disabled:opacity-40',
            className,
          )}
        >
          {selected?.icon && <selected.icon size={16} className="text-subtle" />}
          <BaseSelect.Value className="flex-1 truncate text-left">{selected?.label ?? placeholder}</BaseSelect.Value>
          <BaseSelect.Icon className="flex text-subtle">
            <ChevronDown size={16} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner side="bottom" align="start" sideOffset={6} className="z-60">
            <BaseSelect.Popup className="min-w-(--anchor-width) overflow-hidden rounded-lg border border-border bg-elevated p-1 shadow-md outline-none">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-2 text-body-sm text-foreground outline-none data-[highlighted]:bg-chip-bg"
                >
                  {option.icon && <option.icon size={15} className="text-subtle" />}
                  <BaseSelect.ItemText className="flex-1">{option.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="flex text-accent">
                    <Check size={14} />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
