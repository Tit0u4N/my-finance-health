import { cn } from '../lib/cn';

export type InputControlClassNameOptions = {
  readonly hasLeadingIcon?: boolean;
  readonly hasTrailingContent?: boolean;
  readonly className?: string | undefined;
};

/** The text-field control styling shared by `Input`, `DatePicker`'s trigger, and `Autocomplete`'s
 * input — extracted so the three stay visually identical instead of drifting from three copies of
 * the same class list. */
export function inputControlClassName({
  hasLeadingIcon,
  hasTrailingContent,
  className,
}: InputControlClassNameOptions = {}): string {
  return cn(
    'h-11 w-full rounded-md border border-border bg-surface-alt px-3.5 text-body text-foreground outline-none transition-colors',
    'placeholder:text-subtle',
    'focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent/30',
    'data-[invalid]:border-neg',
    hasLeadingIcon && 'pl-9.5',
    hasTrailingContent && 'pr-9.5',
    className,
  );
}
