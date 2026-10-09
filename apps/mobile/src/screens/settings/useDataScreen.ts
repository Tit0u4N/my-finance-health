// ViewModel for DataScreen.tsx (screens-invest-settings.jsx's `SettingsDatabase`, adapted for
// mobile — screens.md's desktop-shaped "Settings → Database" panel has no mobile referent:
// start-roadmap.md §325 / context.md's file-location row both say mobile cannot open a file in
// place, so there is no `~/Documents/…db` to show). Diverges from desktop's
// useDatabaseScreen.ts in one deliberate way: `isAvailable` is a field on the ready result, not an
// early-return arm, because the record counts and workspace facts below are real content
// regardless of file capability — only the file-management actions (switch file, backup, export,
// reset) need it. Those actions additionally need a *local* session (`useWorkspaceSession()`):
// the in-memory fixture mode has a capable platform but no file to export.

import { describeBootstrapError } from '@repo/app-core/bootstrap/describeBootstrapError';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useExchangeRates } from '@repo/app-core/queries/useExchangeRates';
import { useRecurringRules } from '@repo/app-core/queries/useRecurringRules';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { exportLocalWorkspace } from '@repo/data/workspace/workspaceTransfer';
import { isErr } from '@repo/domain/primitives/result';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { useState } from 'react';
import { useWorkspaceSession } from '@/root/WorkspaceSessionContext';

export type DataMetadataRow = { readonly label: string; readonly value: string };

export type ExportStatus = { readonly tone: 'success' | 'error'; readonly text: string };

/** What the open local workspace can do with its file. English copy only, like the bootstrap flow
 * these actions belong to (no i18n namespace for them yet). */
export type DataFileActions = {
  readonly isExporting: boolean;
  readonly exportStatus: ExportStatus | undefined;
  readonly onExport: () => void;
  readonly onLock: () => void;
  readonly onSwitchWorkspace: () => void;
};

export type UseDataScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly title: string;
      readonly isAvailable: boolean;
      /** Present only for a real local workspace on a platform that can write files. */
      readonly fileActions: DataFileActions | undefined;
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
  const session = useWorkspaceSession();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus | undefined>(undefined);

  const onExport = (): void => {
    if (isExporting || !(session && platform.fileSystem)) {
      return;
    }
    const fileSystem: FileSystemService = platform.fileSystem;
    setExportStatus(undefined);
    setIsExporting(true);
    void (async () => {
      try {
        const target = await fileSystem.pickDirectory();
        if (target === null) {
          return;
        }
        const exported = await exportLocalWorkspace({
          fileSystem,
          clock: platform.clock,
          databasePath: session.databasePath,
          targetDirectory: target,
        });
        setExportStatus(
          isErr(exported)
            ? { tone: 'error', text: describeBootstrapError(exported.error) }
            : {
                tone: 'success',
                text: `Saved “${exported.value.directory.split('/').pop()}” (${exported.value.fileCount} files).`,
              },
        );
      } catch {
        setExportStatus({ tone: 'error', text: 'Could not open the folder picker.' });
      } finally {
        setIsExporting(false);
      }
    })();
  };

  const canUseFiles = platform.capabilities.canWriteFile && session !== null;

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
    fileActions:
      canUseFiles && session
        ? { isExporting, exportStatus, onExport, onLock: session.onLock, onSwitchWorkspace: session.onSwitchWorkspace }
        : undefined,
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
