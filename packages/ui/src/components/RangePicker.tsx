import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { cn } from '../lib/cn';

export type RangePickerOption<TValue extends string> = {
  readonly value: TValue;
  readonly label: string;
};

export type RangePickerProps<TValue extends string> = {
  readonly value: TValue;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly RangePickerOption<TValue>[];
  readonly ariaLabel?: string;
};

/** Segmented single-select control — Account/Investment detail's history range switcher
 * (ui-inventory.md §2's `RangePicker` row). Generic over `TValue` so `@repo/ui` never learns the
 * word `HistoryRange`; `@repo/routes` supplies both the values and their labels. */
export function RangePicker<TValue extends string>({ value, onChange, options, ariaLabel }: RangePickerProps<TValue>) {
  return (
    <ToggleGroup
      aria-label={ariaLabel}
      value={[value]}
      onValueChange={(next) => {
        const [selected] = next as TValue[];
        if (selected !== undefined) {
          onChange(selected);
        }
      }}
      className="flex items-center gap-0.5 rounded-md border border-border bg-chip-bg p-0.75"
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          className={cn(
            'h-6.5 rounded-sm px-3 text-caption text-muted normal-case transition-colors',
            'data-[pressed]:bg-surface data-[pressed]:text-foreground data-[pressed]:shadow-xs',
          )}
        >
          {option.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
