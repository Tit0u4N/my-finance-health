import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { workspaceLabelFromPath } from '@repo/data/local/workspacePaths';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { useState } from 'react';

export type UseWorkspacePickerDeps = {
  readonly fileSystem: FileSystemService;
  readonly onOpen: (ref: WorkspaceRef) => void;
};

export type UseWorkspacePickerResult = {
  readonly onBrowse: () => Promise<void>;
  readonly error: string | undefined;
};

export function useWorkspacePicker({ fileSystem, onOpen }: UseWorkspacePickerDeps): UseWorkspacePickerResult {
  const { t } = useTranslation();
  const [error, setError] = useState<string | undefined>(undefined);

  const onBrowse = async (): Promise<void> => {
    setError(undefined);
    let path: string | null;
    try {
      path = await fileSystem.pickFile({ extensions: ['mfhdb'] });
    } catch {
      setError(t('bootstrap:error.filePicker'));
      return;
    }
    if (!path) {
      return;
    }
    onOpen({ mode: 'local', id: path, path, label: workspaceLabelFromPath(path) });
  };

  return { onBrowse, error };
}
