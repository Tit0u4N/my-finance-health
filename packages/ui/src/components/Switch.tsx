import { Switch as BaseSwitch } from '@base-ui-components/react/switch';
import { cn } from '../lib/cn';

export type SwitchProps = {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly 'aria-label'?: string;
  readonly className?: string;
};

/** Recurring rule's active toggle (ui-inventory.md §1) — the mock's `<div onClick>` has no
 * keyboard support or `role="switch"`; base-ui's `Switch` fixes both. */
export function Switch({ checked, onCheckedChange, disabled = false, className, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        // `inline-flex items-center` is load-bearing, not decorative: a bare <span> defaults to
        // `display: inline`, and inline boxes ignore explicit width/height entirely — without
        // it the track collapses to a sliver regardless of the h-5/w-9 utilities below.
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border-strong bg-chip-bg transition-colors',
        'data-[checked]:border-accent data-[checked]:bg-accent',
        'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-surface shadow-xs transition-transform data-[checked]:translate-x-4.5" />
    </BaseSwitch.Root>
  );
}
