import type { UseWorkspaceBootstrapResult } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import type { CreateWorkspaceInput } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { useState } from 'react';

export type BootstrapMode = 'picker' | 'create';

export type UseBootstrapScreenResult = {
  readonly state: UseWorkspaceBootstrapResult['state'];
  readonly mode: BootstrapMode;
  readonly onStartCreate: () => void;
  readonly onBackToPicker: () => void;
  readonly pending: boolean;
  readonly open: (ref: WorkspaceRef) => void;
  readonly unlock: (ref: WorkspaceRef, secret: string) => void;
  readonly create: (ref: WorkspaceRef, input: CreateWorkspaceInput) => void;
  readonly retry: (() => void) | undefined;
};

export function useBootstrapScreen(bootstrap: UseWorkspaceBootstrapResult): UseBootstrapScreenResult {
  const [mode, setMode] = useState<BootstrapMode>('picker');
  const [lastRef, setLastRef] = useState<WorkspaceRef | undefined>(undefined);
  const [pending, setPending] = useState(false);

  function run(ref: WorkspaceRef, action: () => Promise<void>): void {
    setLastRef(ref);
    setPending(true);
    void action().finally(() => setPending(false));
  }

  return {
    state: bootstrap.state,
    mode,
    onStartCreate: () => setMode('create'),
    onBackToPicker: () => setMode('picker'),
    pending,
    open: (ref) => run(ref, () => bootstrap.open(ref)),
    unlock: (ref, secret) => run(ref, () => bootstrap.unlock(ref, secret)),
    create: (ref, input) => run(ref, () => bootstrap.create(ref, input)),
    retry: lastRef ? () => run(lastRef, () => bootstrap.open(lastRef)) : undefined,
  };
}
