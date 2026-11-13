// @repo/routes — level 3.
// ViewModel for DatabaseScreen.tsx (screens.md "Settings → Database": "file metadata — platform
// file-system capability, not domain data"). Gated on capabilities.canWriteFile, per CLAUDE.md
// principle 1 — a capability check, not a platform name, and not the `.desktop.tsx` route-suffix
// routes.md §5 originally proposed (this repo has no file-based route generation to hang that on).

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useWorkspaceBiometric } from '@repo/app-core/providers/useWorkspaceBiometric';
import { useWorkspaceLock } from '@repo/app-core/providers/useWorkspaceLock';
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

/** This device's biometric copy of the passphrase (open-questions.md #26) — absent when the
 * platform or device has none, or no local workspace is open. */
export type DatabaseBiometric = {
  readonly title: string;
  readonly description: string;
  readonly isEnrolled: boolean;
  readonly turnOffLabel: string;
  readonly isUpdating: boolean;
  readonly error: string | undefined;
  readonly onTurnOff: () => void;
};

export type UseDatabaseScreenResult =
  | { readonly ready: false }
  | { readonly ready: true; readonly isAvailable: false }
  | {
      readonly ready: true;
      readonly isAvailable: true;
      readonly path: string;
      readonly metadata: readonly DatabaseMetadata[];
      readonly actions: readonly DatabaseAction[];
      readonly canLock: boolean;
      readonly onLock: () => void;
      readonly biometric: DatabaseBiometric | undefined;
    };

export function useDatabaseScreen(): UseDatabaseScreenResult {
  const { t } = useTranslation();
  const platform = usePlatform();
  const isAvailable = platform.capabilities.canWriteFile;
  const workspaceLock = useWorkspaceLock();
  const workspaceBiometric = useWorkspaceBiometric();

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

  const notYetAvailable = t('settings:database.notAvailableYet');

  return {
    ready: true,
    isAvailable: true,
    // No workspace path exists yet to read: @repo/routes may not import @repo/data (where a
    // WorkspaceRef lives), and Platform carries no file-path field. Real once bootstrap exposes
    // the active WorkspaceRef through app-core instead — flagged, not silently guessed at.
    path: notYetAvailable,
    metadata: [
      { label: t('settings:database.metadata.size'), value: notYetAvailable },
      { label: t('settings:database.metadata.lastOpened'), value: notYetAvailable },
      { label: t('settings:database.metadata.rows'), value: String(rowCount) },
    ],
    actions: [
      { id: 'switch-file', label: t('settings:database.actions.switchFile'), icon: FolderOpen },
      { id: 'backup', label: t('settings:database.actions.createBackup'), icon: Save },
      { id: 'export', label: t('common:action.exportCsv'), icon: Download },
    ],
    biometric: workspaceBiometric.isAvailable
      ? {
          title: t('settings:database.biometric.title', { label: workspaceBiometric.label }),
          description: workspaceBiometric.isEnrolled
            ? t('settings:database.biometric.enabledDescription', { label: workspaceBiometric.label })
            : t('settings:database.biometric.disabledDescription'),
          isEnrolled: workspaceBiometric.isEnrolled,
          turnOffLabel: t('settings:database.biometric.turnOff'),
          isUpdating: workspaceBiometric.isUpdating,
          error: workspaceBiometric.forgetFailed ? t('settings:database.biometric.turnOffFailed') : undefined,
          onTurnOff: workspaceBiometric.onForget,
        }
      : undefined,
    canLock: workspaceLock.canLock,
    onLock: () => {
      if (workspaceLock.canLock) {
        workspaceLock.lock();
      }
    },
  };
}
