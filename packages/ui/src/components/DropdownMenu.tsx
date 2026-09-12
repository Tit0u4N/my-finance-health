import { Menu as BaseMenu } from '@base-ui-components/react/menu';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type DropdownMenuRootProps = {
  /** Omit both for an uncontrolled menu — a per-row action menu needs no ViewModel state. */
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly children: ReactNode;
};

/** Row edit/delete affordance, grouped instead of two bare icon buttons (ui-inventory.md §1's
 * `DropdownMenu` row: "the mock leaves them unwired; a real implementation should group them"). */
function DropdownMenuRoot({ open, onOpenChange, children }: DropdownMenuRootProps) {
  return <BaseMenu.Root {...(open === undefined ? {} : { open, onOpenChange })}>{children}</BaseMenu.Root>;
}

const DropdownMenuTrigger = BaseMenu.Trigger;

export type DropdownMenuContentProps = ComponentProps<typeof BaseMenu.Popup> & {
  readonly align?: 'start' | 'center' | 'end';
  readonly sideOffset?: number;
};

function DropdownMenuContent({ className, align = 'end', sideOffset = 6, ...props }: DropdownMenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner side="bottom" align={align} sideOffset={sideOffset} className="z-60">
        <BaseMenu.Popup
          className={cn(
            'min-w-44 overflow-hidden rounded-lg border border-border bg-elevated p-1 shadow-md outline-none',
            className,
          )}
          {...props}
        />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export type DropdownMenuItemProps = {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly icon?: LucideIcon;
  readonly tone?: 'default' | 'destructive';
  readonly disabled?: boolean;
};

function DropdownMenuItem({
  children,
  onClick,
  icon: Icon,
  tone = 'default',
  disabled = false,
}: DropdownMenuItemProps) {
  return (
    <BaseMenu.Item
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-2 text-body-sm outline-none data-[highlighted]:bg-chip-bg',
        tone === 'destructive' ? 'text-neg' : 'text-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      )}
    >
      {Icon && <Icon size={15} />}
      {children}
    </BaseMenu.Item>
  );
}

const DropdownMenuSeparator = BaseMenu.Separator;

// Compound-component API (DropdownMenu.Root/Trigger/Content/Item), matches base-ui's own Menu.*
// naming — each key needs its own suppression since useNamingConvention anchors per-property.
export const DropdownMenu = {
  // biome-ignore lint/style/useNamingConvention: compound-component API, matches base-ui's Menu.Root
  Root: DropdownMenuRoot,
  // biome-ignore lint/style/useNamingConvention: compound-component API, matches base-ui's Menu.Trigger
  Trigger: DropdownMenuTrigger,
  // biome-ignore lint/style/useNamingConvention: compound-component API, matches base-ui's Menu.Content
  Content: DropdownMenuContent,
  // biome-ignore lint/style/useNamingConvention: compound-component API, matches base-ui's Menu.Item
  Item: DropdownMenuItem,
  // biome-ignore lint/style/useNamingConvention: compound-component API, matches base-ui's Menu.Separator
  Separator: DropdownMenuSeparator,
};
