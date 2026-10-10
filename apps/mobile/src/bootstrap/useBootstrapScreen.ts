// ViewModel behind BootstrapScreen.tsx — mobile's counterpart of apps/desktop's
// useBootstrapScreen.ts. Reduces the bootstrap state machine plus a "something is in flight" flag
// to the one view the screen should show, and owns the two sheets (create, import) that sit on top
// of the workspace list. English copy only, like desktop's bootstrap flow (no i18n namespace yet).

import { describeBootstrapError } from '@repo/app-core/bootstrap/describeBootstrapError';
import type { UseWorkspaceBootstrapResult } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import type { CreateWorkspaceInput } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { exportLocalWorkspace } from '@repo/data/workspace/workspaceTransfer';
import { isErr } from '@repo/domain/primitives/result';
import type { Platform } from '@repo/platform/platform';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { useState } from 'react';
import { Alert } from 'react-native';
import type { LocalBootstrapProgress } from '@/root/useLocalAppRoot';

export type BootstrapView =
  | { readonly kind: 'loading'; readonly label: string }
  | { readonly kind: 'picker'; readonly recent: readonly WorkspaceRef[] }
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

export function progressLabel(progress: LocalBootstrapProgress): string {
  if (progress === 'migrating') {
    return 'Applying updates…';
  }
  if (progress === 'replaying') {
    return 'Restoring recent changes…';
  }
  return 'Opening…';
}

/** The view for a bootstrap state when nothing is in flight. Pure, so it is tested without React. */
export function viewForState(
  state: UseWorkspaceBootstrapResult['state'],
  progress: LocalBootstrapProgress,
): BootstrapView {
  switch (state.kind) {
    case 'idle':
      return { kind: 'loading', label: 'Loading…' };
    case 'needs-designation':
      return { kind: 'picker', recent: state.recent };
    case 'needs-unlock':
      return { kind: 'unlock', workspaceRef: state.ref };
    case 'migrating':
      return { kind: 'loading', label: progressLabel('migrating') };
    case 'replaying':
      return { kind: 'loading', label: progressLabel('replaying') };
    case 'ready':
      return { kind: 'loading', label: progressLabel(progress) };
    case 'failed':
      return { kind: 'error', message: describeBootstrapError(state.error) };
    default:
      return state satisfies never;
  }
}

/** Saves the copy the user asked for in the create form. The workspace is already created and
 * open by then, so a failure is reported but never undoes the creation. */
async function saveCreationCopy(platform: Platform, ref: WorkspaceRef, folder: string): Promise<void> {
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
        'Workspace created',
        `It could not be copied to the folder you picked. ${describeBootstrapError(exported.error)} You can retry from Settings → Data.`,
      );
      return;
    }
    Alert.alert('Copy saved', `“${exported.value.directory.split('/').pop()}” was saved in the folder you picked.`);
  } catch {
    Alert.alert(
      'Workspace created',
      'It could not be copied to the folder you picked. You can retry from Settings → Data.',
    );
  }
}

export function useBootstrapScreen(
  bootstrap: UseWorkspaceBootstrapResult,
  progress: LocalBootstrapProgress,
  platform: Platform,
): UseBootstrapScreenResult {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [lastRef, setLastRef] = useState<WorkspaceRef | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);

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
    view: isPending ? { kind: 'loading', label: progressLabel(progress) } : viewForState(bootstrap.state, progress),
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
          await saveCreationCopy(platform, ref, backupFolder);
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
