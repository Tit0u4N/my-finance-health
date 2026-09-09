import { useState } from 'react';

export type UseAccountFilterOptions = {
  readonly totalAccounts: number;
  readonly selectedCount: number;
};

export type UseAccountFilterResult = {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly allSelected: boolean;
};

/** Popover open/close — outside-click and `Esc` dismissal come from base-ui's `Popover.Root`
 * itself (ui-inventory.md §4), unlike the mock's hand-rolled `mousedown` listener. */
export function useAccountFilter({ totalAccounts, selectedCount }: UseAccountFilterOptions): UseAccountFilterResult {
  const [open, setOpen] = useState(false);
  return { open, setOpen, allSelected: selectedCount === totalAccounts };
}
