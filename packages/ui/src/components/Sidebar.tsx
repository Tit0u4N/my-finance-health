import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

export type SidebarNavItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  /** An item with no route wired yet renders disabled rather than a dead link. */
  readonly disabled?: boolean;
};

export type SidebarProps = {
  readonly items: readonly SidebarNavItem[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
  readonly amountsHidden: boolean;
  readonly onToggleAmountsHidden: () => void;
};

/** App navigation rail — every app-stage screen (ui-inventory.md §2). Router-agnostic: navigation
 * happens through `onSelect`, since @repo/ui (level 3) may not depend on @repo/router (same level). */
export function Sidebar({ items, activeId, onSelect, amountsHidden, onToggleAmountsHidden }: SidebarProps) {
  return (
    <div className="flex h-full w-59 flex-shrink-0 flex-col border-border border-r bg-surface">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-4">
        <div className="flex h-7.5 w-7.5 flex-shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-accent to-accent-strong font-bold text-sm text-white">
          M
        </div>
        <div className="min-w-0">
          <div className="truncate text-foreground text-label-strong">My Finance Health</div>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 px-3">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex h-9.5 w-full items-center gap-2.5 rounded-sm px-2.5 text-label-strong',
                isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-chip-bg',
                item.disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-0.5 px-3 pb-3">
        <button
          type="button"
          onClick={onToggleAmountsHidden}
          className={cn(
            'flex h-9.5 w-full items-center gap-2.5 rounded-sm px-2.5 text-label-strong',
            amountsHidden ? 'bg-chip-bg text-foreground' : 'text-muted hover:bg-chip-bg',
          )}
        >
          {amountsHidden ? <Eye size={18} /> : <EyeOff size={18} />}
          <span className="truncate">{amountsHidden ? 'Show amounts' : 'Hide amounts'}</span>
        </button>
      </div>
    </div>
  );
}
