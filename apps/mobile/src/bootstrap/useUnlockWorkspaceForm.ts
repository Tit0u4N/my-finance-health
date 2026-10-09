import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { useState } from 'react';

export type UseUnlockWorkspaceFormDeps = {
  readonly workspaceRef: WorkspaceRef;
  readonly onUnlock: (ref: WorkspaceRef, secret: string) => void;
};

export type UseUnlockWorkspaceFormResult = {
  readonly secret: string;
  readonly onSecretChange: (secret: string) => void;
  readonly canSubmit: boolean;
  readonly onSubmit: () => void;
};

export function useUnlockWorkspaceForm({
  workspaceRef,
  onUnlock,
}: UseUnlockWorkspaceFormDeps): UseUnlockWorkspaceFormResult {
  const [secret, setSecret] = useState('');
  const canSubmit = secret.length > 0;

  return {
    secret,
    onSecretChange: setSecret,
    canSubmit,
    onSubmit: () => {
      if (canSubmit) {
        onUnlock(workspaceRef, secret);
      }
    },
  };
}
