import type { CreateWorkspaceInput } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { Button } from '@repo/ui/components/Button';
import { Checkbox } from '@repo/ui/components/Checkbox';
import { Input } from '@repo/ui/components/Input';
import { Select, type SelectOption } from '@repo/ui/components/Select';
import { useCreateWorkspaceForm } from './useCreateWorkspaceForm';

const CURRENCY_OPTIONS: readonly SelectOption<CurrencyCode>[] = [
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
];

export type CreateWorkspaceFormProps = {
  readonly fileSystem: FileSystemService;
  readonly biometricUnlock: BiometricUnlockService | undefined;
  readonly onCreate: (ref: WorkspaceRef, input: CreateWorkspaceInput, remember: boolean) => void;
  readonly onBack: () => void;
};

export function CreateWorkspaceForm({ fileSystem, biometricUnlock, onCreate, onBack }: CreateWorkspaceFormProps) {
  const form = useCreateWorkspaceForm({ fileSystem, biometricUnlock, onCreate });

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Base currency"
        value={form.baseCurrency}
        onValueChange={form.onBaseCurrencyChange}
        options={CURRENCY_OPTIONS}
      />
      <Input
        label="Passphrase"
        type="password"
        value={form.secret}
        onChange={(event) => form.onSecretChange(event.target.value)}
      />
      <Input
        label="Confirm passphrase"
        type="password"
        value={form.confirmSecret}
        onChange={(event) => form.onConfirmSecretChange(event.target.value)}
      />
      <p className="text-body-sm text-muted">
        This passphrase unlocks the file every time it's opened, on every device — write it down somewhere safe.
      </p>
      {form.biometric.isSupported && (
        <label className="flex items-center gap-sm text-body-sm text-muted">
          <Checkbox checked={form.remember} onCheckedChange={form.onRememberChange} />
          Remember with {form.biometric.label} on this device
        </label>
      )}
      {form.error && <span className="text-body-sm text-neg">{form.error}</span>}
      <div className="flex gap-2">
        <Button tone="secondary" fullWidth onClick={onBack}>
          Back
        </Button>
        <Button tone="primary" fullWidth disabled={!form.canSubmit} onClick={form.onSubmit}>
          Choose location & create
        </Button>
      </div>
    </div>
  );
}
