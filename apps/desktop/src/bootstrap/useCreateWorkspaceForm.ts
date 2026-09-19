import { workspaceLabelFromPath } from '@repo/data/local/workspacePaths';
import type { CreateWorkspaceInput } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import { timezoneSchema } from '@repo/domain/primitives/dateTime';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { useState } from 'react';
import { useBiometricAvailability } from './useBiometricAvailability';

const MIN_PASSPHRASE_LENGTH = 8;

export type UseCreateWorkspaceFormDeps = {
  readonly fileSystem: FileSystemService;
  readonly biometricUnlock: BiometricUnlockService | undefined;
  readonly onCreate: (ref: WorkspaceRef, input: CreateWorkspaceInput, remember: boolean) => void;
};

export type UseCreateWorkspaceFormResult = {
  readonly baseCurrency: CurrencyCode;
  readonly onBaseCurrencyChange: (currency: CurrencyCode) => void;
  readonly secret: string;
  readonly onSecretChange: (secret: string) => void;
  readonly confirmSecret: string;
  readonly onConfirmSecretChange: (secret: string) => void;
  readonly error: string | undefined;
  readonly canSubmit: boolean;
  readonly onSubmit: () => Promise<void>;
  readonly remember: boolean;
  readonly onRememberChange: (remember: boolean) => void;
  readonly biometric: { readonly isSupported: boolean; readonly label: string };
};

export function useCreateWorkspaceForm({
  fileSystem,
  biometricUnlock,
  onCreate,
}: UseCreateWorkspaceFormDeps): UseCreateWorkspaceFormResult {
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('EUR');
  const [secret, setSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [remember, setRemember] = useState(false);
  const biometric = useBiometricAvailability(biometricUnlock);

  const canSubmit = secret.length >= MIN_PASSPHRASE_LENGTH && secret === confirmSecret;

  const onSubmit = async (): Promise<void> => {
    setError(undefined);
    if (secret.length < MIN_PASSPHRASE_LENGTH) {
      setError(`Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`);
      return;
    }
    if (secret !== confirmSecret) {
      setError('Passphrases do not match.');
      return;
    }
    let path: string | null;
    try {
      path = await fileSystem.pickSaveLocation({
        extensions: ['mfhdb'],
        suggestedName: 'My Finance Health.mfhdb',
      });
    } catch {
      setError('Could not open the save dialog.');
      return;
    }
    if (!path) {
      return;
    }
    const timezone = timezoneSchema.parse(Intl.DateTimeFormat().resolvedOptions().timeZone);
    onCreate(
      { mode: 'local', id: path, path, label: workspaceLabelFromPath(path) },
      { timezone, baseCurrency, secret },
      remember,
    );
  };

  return {
    baseCurrency,
    onBaseCurrencyChange: setBaseCurrency,
    secret,
    onSecretChange: setSecret,
    confirmSecret,
    onConfirmSecretChange: setConfirmSecret,
    error,
    canSubmit,
    onSubmit,
    remember,
    onRememberChange: setRemember,
    biometric,
  };
}
