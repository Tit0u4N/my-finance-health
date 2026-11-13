// ViewModel behind BootstrapScreen.tsx — mobile's counterpart of apps/desktop's
// useBootstrapScreen.ts. Reduces the bootstrap state machine plus a "something is in flight" flag
// to the one view the screen should show, and owns the two sheets (create, import) that sit on top
// of the workspace list. Copy lives in the `bootstrap` i18n namespace.

import { describeBootstrapError } from '@repo/app-core/bootstrap/describeBootstrapError';
import type { UseWorkspaceBootstrapResult } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import type { CreateWorkspaceInput } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { exportLocalWorkspace } from '@repo/data/workspace/workspaceTransfer';
import { isErr } from '@repo/domain/primitives/result';
import type { Platform } from '@repo/platform/platform';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { useState } from 'react';
import { Alert } from 'react-native';
import type { LocalBootstrapProgress } from '@/root/useLocalAppRoot';
import { useSyncedWorkspaces } from './useSyncedWorkspaces';

export type BootstrapView =
  | { readonly kind: 'loading'; readonly label: string }
  | {
      readonly kind: 'picker';
      readonly recent: readonly WorkspaceRef[];
      /** Found in the synced folder (iCloud Drive) and not already among `recent`. */
      readonly synced: readonly WorkspaceRef[];
    }
  | { readonly kind: 'unlock'; readonly workspaceRef: WorkspaceRef }
  | { readonly kind: 'error'; readonly message: string };

export type UseBootstrapScreenResult = {
  readonly view: BootstrapView;
  readonly isCreateOpen: boolean;
  readonly isImportOpen: boolean;
  readonly onStartCreate: () => void;
  readonly onStartImport: () => void;
  readonly onCloseSheets: () => void;
  readonly onOpen: (ref: WorkspaceRef) => void;
  readonly onUnlock: (ref: WorkspaceRef, secret: string) => void;
  readonly onCreate: (ref: WorkspaceRef, input: CreateWorkspaceInput, backupFolder: string | null) => void;
  /** An imported workspace is opened like any remembered one — straight to its passphrase prompt. */
  readonly onImported: (ref: WorkspaceRef) => void;
  readonly onChooseAnother: () => void;
  /** Absent until there is a workspace to retry. */
  readonly onRetry: (() => void) | undefined;
};

type Translate = ReturnType<typeof useTranslation>['t'];

export function progressLabel(progress: LocalBootstrapProgress, t: Translate): string {
  if (progress === 'migrating') {
    return t('bootstrap:progress.migrating');
  }
  if (progress === 'replaying') {
    return t('bootstrap:progress.replaying');
  }
  return t('bootstrap:progress.opening');
}

/** The view for a bootstrap state when nothing is in flight. Pure, so it is tested without React. */
export function viewForState(
  state: UseWorkspaceBootstrapResult['state'],
  progress: LocalBootstrapProgress,
  t: Translate,
): BootstrapView {
  switch (state.kind) {
    case 'idle':
      return { kind: 'loading', label: t('bootstrap:progress.loading') };
    case 'needs-designation':
      return { kind: 'picker', recent: state.recent, synced: [] };
    case 'needs-unlock':
      return { kind: 'unlock', workspaceRef: state.ref };
    case 'migrating':
      return { kind: 'loading', label: progressLabel('migrating', t) };
    case 'replaying':
      return { kind: 'loading', label: progressLabel('replaying', t) };
    case 'ready':
      return { kind: 'loading', label: progressLabel(progress, t) };
    case 'failed':
      return { kind: 'error', message: describeBootstrapError(state.error, t) };
    default:
      return state satisfies never;
  }
}

/** Adds the synced folder's workspaces to the picker, minus those already listed as recent. */
export function withSyncedWorkspaces(view: BootstrapView, synced: readonly WorkspaceRef[]): BootstrapView {
  if (view.kind !== 'picker') {
    return view;
  }
  const recentIds = new Set(view.recent.map((ref) => ref.id));
  return { ...view, synced: synced.filter((ref) => !recentIds.has(ref.id)) };
}

/** Saves the copy the user asked for in the create form. The workspace is already created and
 * open by then, so a failure is reported but never undoes the creation. */
async function saveCreationCopy(platform: Platform, ref: WorkspaceRef, folder: string, t: Translate): Promise<void> {
  if (ref.mode !== 'local') {
    return;
  }
  try {
    const exported = await exportLocalWorkspace({
      fileSystem: platform.fileSystem as FileSystemService,
      clock: platform.clock,
      databasePath: ref.path,
      targetDirectory: folder,
    });
    if (isErr(exported)) {
      Alert.alert(
        t('bootstrap:create.createdTitle'),
        t('bootstrap:create.copyFailed', { detail: describeBootstrapError(exported.error, t) }),
      );
      return;
    }
    Alert.alert(
      t('bootstrap:create.copySavedTitle'),
      t('bootstrap:create.copySaved', { name: exported.value.directory.split('/').pop() ?? '' }),
    );
  } catch {
    Alert.alert(t('bootstrap:create.createdTitle'), t('bootstrap:create.copyFailedNoDetail'));
  }
}

export function useBootstrapScreen(
  bootstrap: UseWorkspaceBootstrapResult,
  progress: LocalBootstrapProgress,
  platform: Platform,
): UseBootstrapScreenResult {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [lastRef, setLastRef] = useState<WorkspaceRef | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const synced = useSyncedWorkspaces(platform, !isPending && bootstrap.state.kind === 'needs-designation');

  function run(ref: WorkspaceRef, action: () => Promise<void>): void {
    setLastRef(ref);
    setIsPending(true);
    void action().finally(() => setIsPending(false));
  }

  const onCloseSheets = (): void => {
    setIsCreateOpen(false);
    setIsImportOpen(false);
  };

  return {
    view: isPending
      ? { kind: 'loading', label: progressLabel(progress, t) }
      : withSyncedWorkspaces(viewForState(bootstrap.state, progress, t), synced),
    isCreateOpen,
    isImportOpen,
    onStartCreate: () => setIsCreateOpen(true),
    onStartImport: () => setIsImportOpen(true),
    onCloseSheets,
    onOpen: (ref) => run(ref, () => bootstrap.open(ref)),
    onUnlock: (ref, secret) => run(ref, () => bootstrap.unlock(ref, secret)),
    onCreate: (ref, input, backupFolder) => {
      onCloseSheets();
      run(ref, async () => {
        await bootstrap.create(ref, input);
        if (backupFolder !== null) {
          await saveCreationCopy(platform, ref, backupFolder, t);
        }
      });
    },
    onImported: (ref) => {
      onCloseSheets();
      run(ref, () => bootstrap.open(ref));
    },
    onChooseAnother: () => {
      void bootstrap.chooseAnother();
    },
    onRetry: lastRef ? () => run(lastRef, () => bootstrap.open(lastRef)) : undefined,
  };
}
