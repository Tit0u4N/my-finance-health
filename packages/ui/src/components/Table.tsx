import type { ReactNode } from 'react';

export type TableColumn = {
  readonly label: string;
  readonly align?: 'left' | 'right';
  readonly width?: number;
};

export type TableProps = {
  readonly head: readonly TableColumn[];
  readonly children: ReactNode;
  readonly minWidth?: number;
};

/** Plain semantic table — no base-ui primitive, kept close to the mock with `scope="col"` added
 * for the accessibility it skips (ui-inventory.md §1). */
export function Table({ head, children, minWidth }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth }}>
        <thead>
          <tr>
            {head.map((column) => (
              <th
                key={column.label}
                scope="col"
                className="whitespace-nowrap border-border border-b px-3.5 pb-2.5 text-caption text-subtle"
                style={{ textAlign: column.align ?? 'left', width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
