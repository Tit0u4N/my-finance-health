// ViewModel for DataScreen.tsx (screens-invest-settings.jsx's `SettingsDatabase`, adapted for
// mobile — screens.md's desktop-shaped "Settings → Database" panel has no mobile referent:
// start-roadmap.md §325 / context.md's file-location row both say mobile cannot open a file in
// place, so there is no `~/Documents/…db` to show). Diverges from desktop's
// useDatabaseScreen.ts in one deliberate way: `isAvailable` is a field on the ready result, not an
// early-return arm, because the record counts and workspace facts below are real content
// regardless of file capability — only the file-management actions (switch file, backup, export,
// reset) need it, and none of those exist on mobile today.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useExchangeRates } from '@repo/app-core/queries/useExchangeRates';
import { useRecurringRules } from '@repo/app-core/queries/useRecurringRules';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';

export type DataMetadataRow = { readonly label: string; readonly value: string };

export type UseDataScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly title: string;
      readonly isAvailable: boolean;
      readonly emptyTitle: string;
      readonly emptySubtitle: string;
      readonly workspacePanelTitle: string;
      readonly workspacePanelSubtitle: string;
      readonly metadata: readonly DataMetadataRow[];
      readonly newWorkspaceLabel: string;
    };

export function useDataScreen(): UseDataScreenResult {
  const { t } = useTranslation();
  const platform = usePlatform();

  const settingsQuery = useWorkspaceSettings();
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const transactionsQuery = useTransactions({});
  const recurringQuery = useRecurringRules({});
  const ratesQuery = useExchangeRates();

  const ready =
    settingsQuery.data !== undefined &&
    accountsQuery.data !== undefined &&
    categoriesQuery.data !== undefined &&
    transactionsQuery.data !== undefined &&
    recurringQuery.data !== undefined &&
    ratesQuery.data !== undefined;

  if (!ready) {
    return { ready: false };
  }

  const settings = settingsQuery.data as NonNullable<typeof settingsQuery.data>;
  const rowCount =
    (accountsQuery.data as NonNullable<typeof accountsQuery.data>).length +
    (categoriesQuery.data as NonNullable<typeof categoriesQuery.data>).length +
    (transactionsQuery.data as NonNullable<typeof transactionsQuery.data>).length +
    (recurringQuery.data as NonNullable<typeof recurringQuery.data>).length +
    (ratesQuery.data as NonNullable<typeof ratesQuery.data>).length;

  return {
    emptySubtitle: t('settings:database.emptyState.subtitle'),
    emptyTitle: t('settings:database.emptyState.title'),
    isAvailable: platform.capabilities.canWriteFile,
    metadata: [
      { label: t('settings:database.metadata.timezone'), value: settings.timezone },
      { label: t('settings:database.metadata.baseCurrency'), value: settings.baseCurrency },
      { label: t('settings:database.metadata.rows'), value: String(rowCount) },
    ],
    newWorkspaceLabel: t('settings:database.actions.newWorkspace'),
    ready: true,
    title: t('settings:nav.data.label'),
    workspacePanelSubtitle: t('settings:database.workspacePanel.subtitle'),
    workspacePanelTitle: t('settings:database.workspacePanel.title'),
  };
}
