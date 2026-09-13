import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type ComponentProps, useEffect, useRef } from 'react';
import { type DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker';
import { cn } from '../lib/cn';
import { toIsoDate, toLocalDate } from '../lib/localDate';

export type CalendarProps = {
  readonly value: string | undefined;
  readonly onValueChange: (value: string) => void;
  readonly locale: string;
  readonly weekStartsOn?: 0 | 1;
  readonly min?: string;
  readonly max?: string;
  readonly previousMonthLabel: string;
  readonly nextMonthLabel: string;
};

/** shadcn's `calendar` registry item (react-day-picker), retokenized to this repo's theme
 * (ui-inventory.md §1) and narrowed to single-date selection — the only mode any screen here
 * needs. Ranges, week numbers, and the month/year dropdown caption are reachable upstream but
 * unused, so their classNames/components branches are dropped rather than carried dead.
 * Month/weekday names and the previous/next labels come from `Intl`/props, never a date-fns
 * `Locale` object — `@repo/ui` has no way to pick one per language (cross-app-pitfalls.md §5). */
export function Calendar({
  value,
  onValueChange,
  locale,
  weekStartsOn = 1,
  min,
  max,
  previousMonthLabel,
  nextMonthLabel,
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();
  const selected = value ? toLocalDate(value) : undefined;
  const minDate = min ? toLocalDate(min) : undefined;
  const maxDate = max ? toLocalDate(max) : undefined;

  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={(date) => {
        if (date) {
          onValueChange(toIsoDate(date));
        }
      }}
      defaultMonth={selected ?? new Date()}
      weekStartsOn={weekStartsOn}
      disabled={(date) => (minDate ? date < minDate : false) || (maxDate ? date > maxDate : false)}
      showOutsideDays
      captionLayout="label"
      className="bg-elevated p-3 [--cell-size:--spacing(8)]"
      formatters={{
        formatCaption: (month) => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month),
        formatWeekdayName: (day) => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(day),
      }}
      labels={{
        labelPrevious: () => previousMonthLabel,
        labelNext: () => nextMonthLabel,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', defaultClassNames.nav),
        button_previous: cn(
          'inline-flex size-(--cell-size) items-center justify-center rounded-md p-0 text-foreground outline-none transition-colors hover:bg-chip-bg focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          'inline-flex size-(--cell-size) items-center justify-center rounded-md p-0 text-foreground outline-none transition-colors hover:bg-chip-bg focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size) font-medium text-body-sm',
          defaultClassNames.month_caption,
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn('flex-1 select-none rounded-md font-normal text-caption text-subtle', defaultClassNames.weekday),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        day: cn('group/day relative aspect-square h-full w-full select-none p-0 text-center', defaultClassNames.day),
        today: cn('rounded-md bg-chip-bg', defaultClassNames.today),
        outside: cn('text-subtle aria-selected:text-subtle', defaultClassNames.outside),
        disabled: cn('text-subtle opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('size-4', className)} {...props} />
          ) : (
            <ChevronRight className={cn('size-4', className)} {...props} />
          ),
        DayButton: CalendarDayButton,
      }}
    />
  );
}

// Deviates from Button (@repo/ui's shared button): Button has no icon-only size and its `primary`
// tone forces an inline box-shadow ring (Button.tsx), neither of which fits a day cell. A plain
// `<button>` keeps the selected/today state local via data attributes instead.
function CalendarDayButton({ className, day, modifiers, ...props }: ComponentProps<typeof DayButton>) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers['focused']) {
      ref.current?.focus();
    }
  }, [modifiers['focused']]);

  return (
    <button
      ref={ref}
      type="button"
      data-day={toIsoDate(day.date)}
      data-selected-single={modifiers['selected']}
      className={cn(
        'flex aspect-square size-auto w-full min-w-(--cell-size) flex-col items-center justify-center gap-1 rounded-md font-normal leading-none outline-none transition-colors hover:bg-chip-bg focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent data-[selected-single=true]:bg-accent data-[selected-single=true]:text-white',
        className,
      )}
      {...props}
    />
  );
}
