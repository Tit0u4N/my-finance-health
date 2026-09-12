// @repo/routes — level 3.
// ViewModel for DatabaseScreen.tsx (screens.md "Settings → Database": "file metadata — platform
// file-system capability, not domain data"). Gated on capabilities.canWriteFile, per CLAUDE.md
// principle 1 — a capability check, not a platform name, and not the `.desktop.tsx` route-suffix
// routes.md §5 originally proposed (this repo has no file-based route generation to hang that on).

import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useExchangeRates } from '@repo/app-core/queries/useExchangeRates';
import { useInvestments } from '@repo/app-core/queries/useInvestments';
import { useRecurringRules } from '@repo/app-core/queries/useRecurringRules';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import type { LucideIcon } from 'lucide-react';
import { Download, FolderOpen, Save } from 'lucide-react';

export type DatabaseMetadata = { readonly label: string; readonly value: string };
export type DatabaseAction = { readonly id: string; readonly label: string; readonly icon: LucideIcon };

export type UseDatabaseScreenResult =
  | { readonly ready: false }
  | { readonly ready: true; readonly isAvailable: false }
  | {
      readonly ready: true;
      readonly isAvailable: true;
      readonly path: string;
      readonly metadata: readonly DatabaseMetadata[];
      readonly actions: readonly DatabaseAction[];
    };

const NOT_YET_AVAILABLE = 'Not available yet';

const ACTIONS: readonly DatabaseAction[] = [
  { id: 'switch-file', label: 'Switch file', icon: FolderOpen },
  { id: 'backup', label: 'Create backup', icon: Save },
  { id: 'export', label: 'Export CSV', icon: Download },
];

export function useDatabaseScreen(): UseDatabaseScreenResult {
  const platform = usePlatform();
  const isAvailable = platform.capabilities.canWriteFile;

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const transactionsQuery = useTransactions({}, { enabled: isAvailable });
  const recurringQuery = useRecurringRules({});
  const investmentsQuery = useInvestments();
  const ratesQuery = useExchangeRates();

  if (!isAvailable) {
    return { ready: true, isAvailable: false };
  }

  const ready =
    accountsQuery.data !== undefined &&
    categoriesQuery.data !== undefined &&
    transactionsQuery.data !== undefined &&
    recurringQuery.data !== undefined &&
    investmentsQuery.data !== undefined &&
    ratesQuery.data !== undefined;

  if (!ready) {
    return { ready: false };
  }

  const rowCount =
    (accountsQuery.data as NonNullable<typeof accountsQuery.data>).length +
    (categoriesQuery.data as NonNullable<typeof categoriesQuery.data>).length +
    (transactionsQuery.data as NonNullable<typeof transactionsQuery.data>).length +
    (recurringQuery.data as NonNullable<typeof recurringQuery.data>).length +
    (investmentsQuery.data as NonNullable<typeof investmentsQuery.data>).length +
    (ratesQuery.data as NonNullable<typeof ratesQuery.data>).length;

  return {
    ready: true,
    isAvailable: true,
    // No workspace path exists yet to read: @repo/routes may not import @repo/data (where a
    // WorkspaceRef lives), and Platform carries no file-path field. Real once bootstrap exposes
    // the active WorkspaceRef through app-core instead — flagged, not silently guessed at.
    path: NOT_YET_AVAILABLE,
    metadata: [
      { label: 'Size', value: NOT_YET_AVAILABLE },
      { label: 'Last opened', value: NOT_YET_AVAILABLE },
      { label: 'Rows', value: String(rowCount) },
    ],
    actions: ACTIONS,
  };
}
