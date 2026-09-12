import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type TableColumn<TSortKey extends string = string> = {
  readonly label: string;
  readonly align?: 'left' | 'right';
  readonly width?: number;
  /** Present ⇒ this header renders as a sort button (ui-inventory.md §1's sortable-header variant). */
  readonly sortKey?: TSortKey;
  /** Renders the label sr-only — the row-actions column needs an accessible name, not a visible one,
   * and this also keeps `key={column.label}` unique when a table has more than one icon-only column. */
  readonly srOnly?: boolean;
};

export type TableProps<TSortKey extends string = string> = {
  readonly head: readonly TableColumn<TSortKey>[];
  readonly children: ReactNode;
  readonly minWidth?: number;
  readonly sortKey?: TSortKey;
  readonly sortDirection?: 'asc' | 'desc';
  readonly onSortChange?: (key: TSortKey) => void;
};

function sortAriaValue(active: boolean, direction: 'asc' | 'desc' | undefined): 'ascending' | 'descending' | 'none' {
  if (!active) {
    return 'none';
  }
  return direction === 'asc' ? 'ascending' : 'descending';
}

/** Plain semantic table — no base-ui primitive, kept close to the mock with `scope="col"` added
 * for the accessibility it skips (ui-inventory.md §1). Sortable columns are opt-in via
 * `sortKey`/`onSortChange`, so the two existing unsorted call sites need no changes. */
export function Table<TSortKey extends string = string>({
  head,
  children,
  minWidth,
  sortKey,
  sortDirection,
  onSortChange,
}: TableProps<TSortKey>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth }}>
        <thead>
          <tr>
            {head.map((column) => {
              const isSortable = column.sortKey !== undefined && onSortChange !== undefined;
              const isActive = isSortable && column.sortKey === sortKey;
              const Icon = isActive ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
              return (
                <th
                  key={column.label}
                  scope="col"
                  aria-sort={isSortable ? sortAriaValue(isActive, sortDirection) : undefined}
                  className="whitespace-nowrap border-border border-b px-3.5 pb-2.5 text-caption text-subtle"
                  style={{ textAlign: column.align ?? 'left', width: column.width }}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(column.sortKey as TSortKey)}
                      className={cn(
                        'inline-flex items-center gap-1 text-caption text-subtle transition-colors hover:text-foreground',
                        column.align === 'right' && 'flex-row-reverse',
                      )}
                    >
                      <span className={column.srOnly ? 'sr-only' : undefined}>{column.label}</span>
                      <Icon size={12} className={isActive ? 'text-foreground' : 'text-subtle/60'} />
                    </button>
                  ) : (
                    <span className={column.srOnly ? 'sr-only' : undefined}>{column.label}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
