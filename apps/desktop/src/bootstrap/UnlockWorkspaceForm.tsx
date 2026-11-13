import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { Button } from '@repo/ui/components/Button';
import { Checkbox } from '@repo/ui/components/Checkbox';
import { Input } from '@repo/ui/components/Input';
import { useUnlockWorkspaceForm } from './useUnlockWorkspaceForm';

export type UnlockWorkspaceFormProps = {
  readonly workspaceRef: WorkspaceRef;
  readonly biometricUnlock: BiometricUnlockService | undefined;
  readonly onUnlock: (ref: WorkspaceRef, secret: string, remember: boolean, sourcedFromBiometric: boolean) => void;
};

export function UnlockWorkspaceForm({ workspaceRef, biometricUnlock, onUnlock }: UnlockWorkspaceFormProps) {
  const { t } = useTranslation();
  const form = useUnlockWorkspaceForm({ workspaceRef, biometricUnlock, onUnlock });

  return (
    <div className="flex flex-col gap-4">
      <div className="truncate text-body-sm text-muted">{workspaceRef.label}</div>
      <Input
        label={t('bootstrap:passphrase.label')}
        type="password"
        autoFocus
        value={form.secret}
        onChange={(event) => form.onSecretChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            form.onSubmit();
          }
        }}
      />
      {form.biometric.isSupported && (
        <label className="flex items-center gap-sm text-body-sm text-muted">
          <Checkbox checked={form.remember} onCheckedChange={form.onRememberChange} />
          {t('bootstrap:unlock.remember', { label: form.biometric.label })}
        </label>
      )}
      <Button tone="primary" fullWidth disabled={!form.canSubmit} onClick={form.onSubmit}>
        {t('bootstrap:unlock.submit')}
      </Button>
      {form.biometric.isSupported && (
        <Button tone="secondary" fullWidth onClick={form.onBiometricUnlock}>
          {t('bootstrap:unlock.unlockWith', { label: form.biometric.label })}
        </Button>
      )}
    </div>
  );
}
