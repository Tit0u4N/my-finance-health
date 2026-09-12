import { Popover as BasePopover } from '@base-ui-components/react/popover';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type PopoverRootProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly children: ReactNode;
};

/** Groups trigger + content, controlled open state — the outside-click/`Esc` dismissal the mock hand-rolls
 * (`ui-inventory.md` §1, `AccountFilter` row). */
export function PopoverRoot({ open, onOpenChange, children }: PopoverRootProps) {
  return (
    <BasePopover.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </BasePopover.Root>
  );
}

export const PopoverTrigger = BasePopover.Trigger;

export type PopoverContentProps = ComponentProps<typeof BasePopover.Popup> & {
  readonly align?: 'start' | 'center' | 'end';
  readonly sideOffset?: number;
};

export function PopoverContent({ className, align = 'end', sideOffset = 8, ...props }: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner side="bottom" align={align} sideOffset={sideOffset} className="z-60">
        <BasePopover.Popup
          className={cn(
            'w-72 overflow-hidden rounded-lg border border-border bg-elevated shadow-md outline-none',
            className,
          )}
          {...props}
        />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

// biome-ignore lint/style/useNamingConvention: compound-component API (Popover.Root/Trigger/Content), matches base-ui's own Popover.* naming
export const Popover = { Root: PopoverRoot, Trigger: PopoverTrigger, Content: PopoverContent };
