import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';
import { Tooltip } from './Tooltip';

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
  /** A second, visually separated group pinned above the hide-amounts button — Settings
   * (ui-inventory.md §2), so the caller never has to slice `items` itself. */
  readonly footerItems?: readonly SidebarNavItem[];
  /** Icon-only rail — the "sidebar mode" Settings → Preferences control actually drives (was
   * dead layout space before that setting existed). */
  readonly collapsed?: boolean;
  /** @repo/ui may not import @repo/i18n (start-roadmap.md §6) — every string below is a required
   * prop so the caller in @repo/routes can never forget to translate one. */
  readonly brandLabel: string;
  readonly showAmountsLabel: string;
  readonly hideAmountsLabel: string;
};

type NavButtonProps = {
  readonly item: SidebarNavItem;
  readonly isActive: boolean;
  readonly collapsed: boolean;
  readonly onSelect: (id: string) => void;
};

function NavButton({ item, isActive, collapsed, onSelect }: NavButtonProps) {
  const Icon = item.icon;
  const button = (
    <button
      type="button"
      disabled={item.disabled}
      onClick={() => onSelect(item.id)}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        'flex h-9.5 w-full items-center gap-2.5 rounded-sm px-2.5 text-label-strong',
        collapsed && 'justify-center px-0',
        isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-chip-bg',
        item.disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
      )}
    >
      <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
  return collapsed ? (
    <Tooltip label={item.label} side="right">
      {button}
    </Tooltip>
  ) : (
    button
  );
}

/** App navigation rail — every app-stage screen (ui-inventory.md §2). Router-agnostic: navigation
 * happens through `onSelect`, since @repo/ui (level 3) may not depend on @repo/router (same level). */
export function Sidebar({
  items,
  activeId,
  onSelect,
  amountsHidden,
  onToggleAmountsHidden,
  footerItems = [],
  collapsed = false,
  brandLabel,
  showAmountsLabel,
  hideAmountsLabel,
}: SidebarProps) {
  const amountsToggleLabel = amountsHidden ? showAmountsLabel : hideAmountsLabel;
  const hideAmountsButton = (
    <button
      type="button"
      onClick={onToggleAmountsHidden}
      aria-label={collapsed ? amountsToggleLabel : undefined}
      className={cn(
        'flex h-9.5 w-full items-center gap-2.5 rounded-sm px-2.5 text-label-strong',
        collapsed && 'justify-center px-0',
        amountsHidden ? 'bg-chip-bg text-foreground' : 'text-muted hover:bg-chip-bg',
      )}
    >
      {amountsHidden ? <Eye size={18} /> : <EyeOff size={18} />}
      {!collapsed && <span className="truncate">{amountsToggleLabel}</span>}
    </button>
  );

  return (
    <div
      className={cn(
        'flex h-full flex-shrink-0 flex-col border-border border-r bg-surface transition-[width]',
        collapsed ? 'w-16' : 'w-59',
      )}
    >
      <div className={cn('flex items-center gap-2.5 px-4 pt-4 pb-4', collapsed && 'justify-center px-0')}>
        <div className="flex h-7.5 w-7.5 flex-shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-accent to-accent-strong font-bold text-sm text-white">
          M
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-foreground text-label-strong">{brandLabel}</div>
          </div>
        )}
      </div>

      <div className={cn('flex flex-col gap-0.5', collapsed ? 'px-2.5' : 'px-3')}>
        {items.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={item.id === activeId}
            collapsed={collapsed}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="flex-1" />

      {footerItems.length > 0 && (
        <div className={cn('flex flex-col gap-0.5 border-border border-t pt-2', collapsed ? 'px-2.5' : 'px-3')}>
          {footerItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={item.id === activeId}
              collapsed={collapsed}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      <div className={cn('flex flex-col gap-0.5 pb-3', collapsed ? 'px-2.5' : 'px-3')}>
        {collapsed ? (
          <Tooltip label={amountsToggleLabel} side="right">
            {hideAmountsButton}
          </Tooltip>
        ) : (
          hideAmountsButton
        )}
      </div>
    </div>
  );
}
