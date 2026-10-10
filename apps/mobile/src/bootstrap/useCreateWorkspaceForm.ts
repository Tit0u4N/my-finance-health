// ViewModel behind CreateWorkspaceSheet.tsx. A mobile workspace always lives in the app sandbox, at
// a path the core chooses (`sandboxWorkspacePath`): the OS cannot open a database in place inside
// iCloud Drive or another provider's folder. The place the user *does* get to designate is where a
// copy of the workspace is saved right after creation (a folder from the system picker — iCloud
// Drive, "On My iPhone", …); it is optional and can always be done later from Settings → Data.

import { MIN_PASSPHRASE_LENGTH, validateNewPassphrase } from '@repo/app-core/bootstrap/newPassphrase';
import { workspaceLabelFromPath } from '@repo/data/local/workspacePaths';
import type { CreateWorkspaceInput } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { sandboxWorkspacePath } from '@repo/data/workspace/workspaceTransfer';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import { timezoneSchema } from '@repo/domain/primitives/dateTime';
import type { Platform } from '@repo/platform/platform';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { useState } from 'react';

const DEFAULT_NAME = 'My Finance Health';

export type UseCreateWorkspaceFormDeps = {
  readonly platform: Platform;
  readonly onCreate: (ref: WorkspaceRef, input: CreateWorkspaceInput, backupFolder: string | null) => void;
};

export type UseCreateWorkspaceFormResult = {
  readonly name: string;
  readonly onNameChange: (name: string) => void;
  readonly baseCurrency: CurrencyCode;
  readonly onBaseCurrencyChange: (currency: CurrencyCode) => void;
  readonly secret: string;
  readonly onSecretChange: (secret: string) => void;
  readonly confirmSecret: string;
  readonly onConfirmSecretChange: (secret: string) => void;
  readonly error: string | undefined;
  /** The folder picked for the post-creation copy; null until the user picks one. */
  readonly backupFolder: string | null;
  readonly onChooseBackupFolder: () => Promise<void>;
  readonly onClearBackupFolder: () => void;
  readonly canSubmit: boolean;
  readonly isSubmitting: boolean;
  readonly onSubmit: () => Promise<void>;
  readonly minPassphraseLength: number;
};

export function useCreateWorkspaceForm({
  platform,
  onCreate,
}: UseCreateWorkspaceFormDeps): UseCreateWorkspaceFormResult {
  const [name, setName] = useState(DEFAULT_NAME);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('EUR');
  const [secret, setSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backupFolder, setBackupFolder] = useState<string | null>(null);

  const canSubmit = validateNewPassphrase(secret, confirmSecret) === undefined && !isSubmitting;

  const onChooseBackupFolder = async (): Promise<void> => {
    try {
      const folder = await (platform.fileSystem as FileSystemService).pickDirectory();
      if (folder !== null) {
        setBackupFolder(folder);
      }
    } catch {
      setError('Could not open the folder picker.');
    }
  };

  const onSubmit = async (): Promise<void> => {
    const passphraseError = validateNewPassphrase(secret, confirmSecret);
    if (passphraseError) {
      setError(passphraseError);
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      const path = await sandboxWorkspacePath(platform.fileSystem as FileSystemService, platform.random, name);
      const timezone = timezoneSchema.parse(platform.clock.systemTimezone());
      onCreate(
        { mode: 'local', id: path, path, label: workspaceLabelFromPath(path) },
        { timezone, baseCurrency, secret },
        backupFolder,
      );
    } catch {
      setError('Could not prepare a place for the workspace on this device.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    name,
    onNameChange: setName,
    baseCurrency,
    onBaseCurrencyChange: setBaseCurrency,
    secret,
    onSecretChange: setSecret,
    confirmSecret,
    onConfirmSecretChange: setConfirmSecret,
    error,
    backupFolder,
    onChooseBackupFolder,
    onClearBackupFolder: () => setBackupFolder(null),
    canSubmit,
    isSubmitting,
    onSubmit,
    minPassphraseLength: MIN_PASSPHRASE_LENGTH,
  };
}
