import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/cn';
import { Calendar } from './Calendar';
import { inputControlClassName } from './inputControlClassName';
import { Popover } from './Popover';

export type DatePickerProps = {
  readonly label?: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  /** Pre-formatted by the caller (`formatAbsoluteDate`, in @repo/app-core) — this component never
   * formats a date itself (ui-inventory.md §4: no formatting logic in @repo/ui). */
  readonly displayValue: string;
  readonly placeholder: string;
  readonly locale: string;
  readonly previousMonthLabel: string;
  readonly nextMonthLabel: string;
  readonly openCalendarLabel: string;
  readonly min?: string;
  readonly max?: string;
  readonly error?: string;
  readonly disabled?: boolean;
};

/** Popover-hosted `Calendar` replacing the native `<input type="date">` (ui-inventory.md §1) —
 * consistent styling and keyboard nav across Chromium/WebView2/WKWebView, and a value that can
 * never reach the caller malformed the way free-typed native date text could. No `Field` here,
 * the same call `Select` makes (Select.tsx): the trigger isn't a native input, so it takes a
 * visible `<span>` label plus `aria-label` instead of `Field.Label`'s automatic association. */
export function DatePicker({
  label,
  value,
  onValueChange,
  displayValue,
  placeholder,
  locale,
  previousMonthLabel,
  nextMonthLabel,
  openCalendarLabel,
  min,
  max,
  error,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const accessibleLabel = label ?? openCalendarLabel;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-label text-muted">{label}</span>}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          type="button"
          disabled={disabled}
          aria-label={accessibleLabel}
          aria-invalid={error ? true : undefined}
          className={cn(
            inputControlClassName({ hasTrailingContent: true }),
            'flex items-center text-left',
            !displayValue && 'text-subtle',
            error && 'border-neg',
          )}
        >
          <span className="flex-1 truncate">{displayValue || placeholder}</span>
          <CalendarDays size={16} className="pointer-events-none text-subtle" />
        </Popover.Trigger>
        <Popover.Content align="start" className="w-auto p-0">
          <Calendar
            value={value || undefined}
            onValueChange={(next) => {
              onValueChange(next);
              setOpen(false);
            }}
            locale={locale}
            {...(min ? { min } : {})}
            {...(max ? { max } : {})}
            previousMonthLabel={previousMonthLabel}
            nextMonthLabel={nextMonthLabel}
          />
        </Popover.Content>
      </Popover.Root>
      {error && <span className="text-body-sm text-neg">{error}</span>}
    </div>
  );
}
