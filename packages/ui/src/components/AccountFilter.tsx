import { ChevronDown, type LucideIcon, Wallet } from 'lucide-react';
import { cn } from '../lib/cn';
import { AmountValue } from './AmountValue';
import { Avatar } from './Avatar';
import { Checkbox } from './Checkbox';
import { Popover } from './Popover';
import { useAccountFilter } from './useAccountFilter';

export type AccountFilterRow = {
  readonly id: string;
  readonly name: string;
  readonly typeLabel: string;
  readonly icon: LucideIcon;
  readonly color: string;
  /** Already formatted by the money-formatting selector — never a raw amount here. */
  readonly balanceLabel: string;
};

export type AccountFilterProps = {
  readonly accounts: readonly AccountFilterRow[];
  readonly selectedIds: readonly string[];
  readonly onToggle: (id: string) => void;
  readonly onSelectAll: () => void;
  readonly hidden: boolean;
  /** @repo/ui may not import @repo/i18n (start-roadmap.md §6): the caller in @repo/routes builds
   * this from the selection (all / one account's own name / a "{{count}} accounts" plural) so
   * translation and pluralization stay entirely on its side. */
  readonly triggerLabel: string;
  readonly groupLabel: string;
  readonly selectAllLabel: string;
};

/** Account scope filter dropdown — Overview, Transactions, Recurring (ui-inventory.md §2). */
export function AccountFilter({
  accounts,
  selectedIds,
  onToggle,
  onSelectAll,
  hidden,
  triggerLabel,
  groupLabel,
  selectAllLabel,
}: AccountFilterProps) {
  const { open, setOpen, allSelected } = useAccountFilter({
    totalAccounts: accounts.length,
    selectedCount: selectedIds.length,
  });

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={cn(
          'inline-flex h-8.5 items-center gap-1.5 rounded-sm px-2.5 text-body-sm',
          allSelected
            ? 'border border-border bg-surface text-foreground'
            : 'border border-accent/40 bg-accent-soft text-accent',
        )}
      >
        <Wallet size={14} />
        <span className="max-w-37.5 truncate">{triggerLabel}</span>
        {!allSelected && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-bold text-white text-xs">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown size={13} />
      </Popover.Trigger>
      <Popover.Content>
        <div className="flex items-center justify-between border-border border-b px-3.5 pt-2.5 pb-2">
          <span className="text-caption text-subtle">{groupLabel}</span>
          <button
            type="button"
            onClick={onSelectAll}
            className={cn('text-body-sm', allSelected ? 'text-subtle' : 'text-accent')}
          >
            {selectAllLabel}
          </button>
        </div>
        <div className="max-h-73 overflow-y-auto p-1.5">
          {accounts.map((account) => {
            const checked = selectedIds.includes(account.id);
            const inputId = `account-filter-${account.id}`;
            return (
              // A <label> associated with the Checkbox's hidden <input> — clicking anywhere in
              // the row toggles it natively, no click handler (or double-toggle risk) needed.
              <label
                key={account.id}
                htmlFor={inputId}
                className="flex cursor-pointer items-center gap-2.5 rounded-sm p-2 hover:bg-surface-alt"
              >
                <Checkbox id={inputId} checked={checked} onCheckedChange={() => onToggle(account.id)} />
                <Avatar icon={account.icon} color={account.color} soft size={26} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-sm text-foreground">{account.name}</div>
                  <div className="text-caption text-subtle normal-case">{account.typeLabel}</div>
                </div>
                <AmountValue value={account.balanceLabel} hidden={hidden} tone="muted" className="text-body-sm" />
              </label>
            );
          })}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
