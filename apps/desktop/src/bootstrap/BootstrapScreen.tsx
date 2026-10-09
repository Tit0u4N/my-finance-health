import { describeBootstrapError } from '@repo/app-core/bootstrap/describeBootstrapError';
import type { UseWorkspaceBootstrapResult } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import type { Platform } from '@repo/platform/platform';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { Panel } from '@repo/ui/components/Panel';
import type { ReactNode } from 'react';
import { BootstrapError } from './BootstrapError';
import { BootstrapProgress } from './BootstrapProgress';
import { CreateWorkspaceForm } from './CreateWorkspaceForm';
import { UnlockWorkspaceForm } from './UnlockWorkspaceForm';
import type { BiometricIntent } from './useBiometricEnrollment';
import type { UseBootstrapScreenResult } from './useBootstrapScreen';
import { useBootstrapScreen } from './useBootstrapScreen';
import { WorkspacePicker } from './WorkspacePicker';

export type BootstrapScreenProps = {
  readonly platform: Platform;
  readonly bootstrap: UseWorkspaceBootstrapResult;
  /** Cosmetic only — labels the spinner while `unlock`/`create` is in flight (see
   * useLocalApp.ts's docblock on why this can't be a real BootstrapState transition). */
  readonly progress: 'migrating' | 'replaying' | null;
  readonly onBiometricIntent: (intent: BiometricIntent) => void;
};

function progressLabel(progress: BootstrapScreenProps['progress']): string {
  if (progress === 'migrating') {
    return 'Applying updates…';
  }
  if (progress === 'replaying') {
    return 'Restoring recent changes…';
  }
  return 'Opening…';
}

function renderBootstrapBody(
  screen: UseBootstrapScreenResult,
  fileSystem: FileSystemService,
  biometricUnlock: BiometricUnlockService | undefined,
  progress: BootstrapScreenProps['progress'],
): ReactNode {
  if (screen.pending) {
    return <BootstrapProgress label={progressLabel(progress)} />;
  }

  switch (screen.state.kind) {
    case 'idle':
      return <BootstrapProgress label="Loading…" />;
    case 'needs-designation':
      return screen.mode === 'create' ? (
        <CreateWorkspaceForm
          fileSystem={fileSystem}
          biometricUnlock={biometricUnlock}
          onCreate={screen.create}
          onBack={screen.onBackToPicker}
        />
      ) : (
        <WorkspacePicker
          recent={screen.state.recent}
          fileSystem={fileSystem}
          onOpen={screen.open}
          onStartCreate={screen.onStartCreate}
        />
      );
    case 'needs-unlock':
      return (
        <UnlockWorkspaceForm
          workspaceRef={screen.state.ref}
          biometricUnlock={biometricUnlock}
          onUnlock={screen.unlock}
        />
      );
    case 'migrating':
      return <BootstrapProgress label={progressLabel('migrating')} />;
    case 'replaying':
      return <BootstrapProgress label={progressLabel('replaying')} />;
    case 'ready':
      return <BootstrapProgress label="Opening…" />;
    case 'failed':
      return <BootstrapError message={describeBootstrapError(screen.state.error)} onRetry={screen.retry} />;
    default:
      return screen.state satisfies never;
  }
}

export function BootstrapScreen({ platform, bootstrap, progress, onBiometricIntent }: BootstrapScreenProps) {
  const screen = useBootstrapScreen(bootstrap, onBiometricIntent);
  const fileSystem = platform.fileSystem as FileSystemService;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt p-lg">
      {/* max-w-112 (28rem), not max-w-md: @repo/ui's --spacing-md token (theme.css) collides with
          Tailwind's named md container scale, silently resolving max-w-md to 1rem instead of 28rem
          — the numbered scale sidesteps the collision (see EmptyState.tsx's max-w-80 for the same fix). */}
      <div className="w-full max-w-112">
        <Panel title="my finance health">
          {renderBootstrapBody(screen, fileSystem, platform.biometricUnlock, progress)}
        </Panel>
      </div>
    </div>
  );
}
