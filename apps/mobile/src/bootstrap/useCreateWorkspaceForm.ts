// ViewModel behind CreateWorkspaceSheet.tsx. A mobile workspace lives in one of two places, each a
// folder named after it (`newWorkspacePath`, the vault layout):
//   - "device": the app's own storage, visible in the Files app under On My iPhone;
//   - "cloud": the system-synced app folder (`syncedDirectory()` — iCloud Drive's on iOS), opened
//     in place and synced by the OS to the user's other devices. Offered only while available:
//     Android has none, and iOS has none until the iCloud entitlement is set up
//     (docs/owner-setup.md §2) and an account is signed in.
// A folder the user picks in the system picker cannot host a live database (start-roadmap.md §9,
// "Mobile case"), so for a device workspace the user may instead ask for a copy to be saved there
// right after creation — optional, and always possible later from Settings → Data.

import { MIN_PASSPHRASE_LENGTH, validateNewPassphrase } from '@repo/app-core/bootstrap/newPassphrase';
import { workspaceLabelFromPath } from '@repo/data/local/workspacePaths';
import type { CreateWorkspaceInput } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { deviceWorkspacesDirectory, newWorkspacePath } from '@repo/data/workspace/workspaceTransfer';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import { timezoneSchema } from '@repo/domain/primitives/dateTime';
import type { Platform } from '@repo/platform/platform';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { useEffect, useState } from 'react';

const DEFAULT_NAME = 'My Finance Health';

export type WorkspaceLocation = 'device' | 'cloud';

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
  /** False until the synced folder is known to be available — the location choice is hidden then. */
  readonly isCloudAvailable: boolean;
  readonly location: WorkspaceLocation;
  readonly onLocationChange: (location: WorkspaceLocation) => void;
  /** The folder picked for the post-creation copy; null until the user picks one. Device only. */
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
  const fileSystem = platform.fileSystem as FileSystemService;
  const [name, setName] = useState(DEFAULT_NAME);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('EUR');
  const [secret, setSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backupFolder, setBackupFolder] = useState<string | null>(null);
  const [syncedRoot, setSyncedRoot] = useState<string | null>(null);
  const [location, setLocation] = useState<WorkspaceLocation>('device');

  useEffect(() => {
    let isCurrent = true;
    fileSystem
      .syncedDirectory()
      .then((root) => {
        if (isCurrent && root !== null) {
          setSyncedRoot(root);
          // The user who has the synced folder set up most likely wants to use it.
          setLocation('cloud');
        }
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [fileSystem]);

  const isCloud = location === 'cloud' && syncedRoot !== null;
  const canSubmit = validateNewPassphrase(secret, confirmSecret) === undefined && !isSubmitting;

  const onChooseBackupFolder = async (): Promise<void> => {
    try {
      const folder = await fileSystem.pickDirectory();
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
      const root = isCloud && syncedRoot !== null ? syncedRoot : await deviceWorkspacesDirectory(fileSystem);
      const path = await newWorkspacePath(fileSystem, root, name);
      const timezone = timezoneSchema.parse(platform.clock.systemTimezone());
      onCreate(
        { mode: 'local', id: path, path, label: workspaceLabelFromPath(path) },
        { timezone, baseCurrency, secret },
        isCloud ? null : backupFolder,
      );
    } catch {
      setError(
        isCloud
          ? 'Could not prepare a folder in iCloud Drive. Check that iCloud Drive is on, or keep it on this device.'
          : 'Could not prepare a place for the workspace on this device.',
      );
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
    isCloudAvailable: syncedRoot !== null,
    location: isCloud ? 'cloud' : 'device',
    onLocationChange: setLocation,
    backupFolder,
    onChooseBackupFolder,
    onClearBackupFolder: () => setBackupFolder(null),
    canSubmit,
    isSubmitting,
    onSubmit,
    minPassphraseLength: MIN_PASSPHRASE_LENGTH,
  };
}
