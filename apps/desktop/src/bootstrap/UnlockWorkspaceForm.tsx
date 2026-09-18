import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { Button } from '@repo/ui/components/Button';
import { Input } from '@repo/ui/components/Input';
import { useUnlockWorkspaceForm } from './useUnlockWorkspaceForm';

export type UnlockWorkspaceFormProps = {
  readonly workspaceRef: WorkspaceRef;
  readonly onUnlock: (ref: WorkspaceRef, secret: string) => void;
};

export function UnlockWorkspaceForm({ workspaceRef, onUnlock }: UnlockWorkspaceFormProps) {
  const form = useUnlockWorkspaceForm({ workspaceRef, onUnlock });

  return (
    <div className="flex flex-col gap-4">
      <div className="truncate text-body-sm text-muted">{workspaceRef.label}</div>
      <Input
        label="Passphrase"
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
      <Button tone="primary" fullWidth disabled={!form.canSubmit} onClick={form.onSubmit}>
        Unlock
      </Button>
    </div>
  );
}
