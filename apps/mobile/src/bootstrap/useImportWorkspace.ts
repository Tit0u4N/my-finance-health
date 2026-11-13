// ViewModel behind ImportWorkspaceSheet.tsx — bring a workspace back from a folder the user
// picks (iCloud Drive, Google Drive, "On My iPhone", a USB drive, a synced desktop folder…). The
// folder must directly contain the `.mfhdb` and its `.mfhmeta`; the core copies the lot into the
// app sandbox (workspaceTransfer.ts), so the workspace never depends on the picked location again.

import { describeBootstrapError } from '@repo/app-core/bootstrap/describeBootstrapError';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { findImportableWorkspaces, importLocalWorkspace } from '@repo/data/workspace/workspaceTransfer';
import { isErr } from '@repo/domain/primitives/result';
import type { Platform } from '@repo/platform/platform';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { useState } from 'react';

export type ImportCandidate = { readonly path: string; readonly label: string };

export type UseImportWorkspaceDeps = {
  readonly platform: Platform;
  readonly onImported: (ref: WorkspaceRef) => void;
};

export type UseImportWorkspaceResult = {
  readonly candidates: readonly ImportCandidate[];
  readonly message: string | undefined;
  readonly isBusy: boolean;
  readonly onPickFolder: () => Promise<void>;
  readonly onSelect: (candidate: ImportCandidate) => Promise<void>;
};

function labelOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return name.endsWith('.mfhdb') ? name.slice(0, -'.mfhdb'.length) : name;
}

export function useImportWorkspace({ platform, onImported }: UseImportWorkspaceDeps): UseImportWorkspaceResult {
  const { t } = useTranslation();
  const fileSystem = platform.fileSystem as FileSystemService;
  const [candidates, setCandidates] = useState<readonly ImportCandidate[]>([]);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [isBusy, setIsBusy] = useState(false);

  const onPickFolder = async (): Promise<void> => {
    setMessage(undefined);
    setCandidates([]);
    setIsBusy(true);
    try {
      const folder = await fileSystem.pickDirectory();
      if (folder === null) {
        return;
      }
      const found = await findImportableWorkspaces(fileSystem, folder);
      setCandidates(found.map((path) => ({ path, label: labelOf(path) })));
      if (found.length === 0) {
        setMessage(t('bootstrap:import.nothingFound'));
      }
    } catch {
      setMessage(t('bootstrap:import.readError'));
    } finally {
      setIsBusy(false);
    }
  };

  const onSelect = async (candidate: ImportCandidate): Promise<void> => {
    setMessage(undefined);
    setIsBusy(true);
    try {
      const result = await importLocalWorkspace({ fileSystem, sourceDatabasePath: candidate.path });
      if (isErr(result)) {
        setMessage(describeBootstrapError(result.error, t));
        return;
      }
      onImported(result.value);
    } finally {
      setIsBusy(false);
    }
  };

  return { candidates, message, isBusy, onPickFolder, onSelect };
}
