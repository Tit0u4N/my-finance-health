import type { BiometricIntent } from '@repo/app-core/bootstrap/biometric/useBiometricEnrollment';
import { describeBootstrapError } from '@repo/app-core/bootstrap/describeBootstrapError';
import type { UseWorkspaceBootstrapResult } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import type { Platform } from '@repo/platform/platform';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { Panel } from '@repo/ui/components/Panel';
import type { ReactNode } from 'react';
import { BootstrapError } from './BootstrapError';
import { BootstrapProgress } from './BootstrapProgress';
import { CreateWorkspaceForm } from './CreateWorkspaceForm';
import { UnlockWorkspaceForm } from './UnlockWorkspaceForm';
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
  /** Another device took the occupancy lock over, so this one was locked (audit P6). */
  readonly lockLost?: boolean;
};

type Translate = ReturnType<typeof useTranslation>['t'];

function progressLabel(progress: BootstrapScreenProps['progress'], t: Translate): string {
  if (progress === 'migrating') {
    return t('bootstrap:progress.migrating');
  }
  if (progress === 'replaying') {
    return t('bootstrap:progress.replaying');
  }
  return t('bootstrap:progress.opening');
}

function renderBootstrapBody(
  screen: UseBootstrapScreenResult,
  fileSystem: FileSystemService,
  biometricUnlock: BiometricUnlockService | undefined,
  progress: BootstrapScreenProps['progress'],
  t: Translate,
): ReactNode {
  if (screen.pending) {
    return <BootstrapProgress label={progressLabel(progress, t)} />;
  }

  switch (screen.state.kind) {
    case 'idle':
      return <BootstrapProgress label={t('bootstrap:progress.loading')} />;
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
      return <BootstrapProgress label={progressLabel('migrating', t)} />;
    case 'replaying':
      return <BootstrapProgress label={progressLabel('replaying', t)} />;
    case 'ready':
      return <BootstrapProgress label={t('bootstrap:progress.opening')} />;
    case 'failed':
      return <BootstrapError message={describeBootstrapError(screen.state.error, t)} onRetry={screen.retry} />;
    default:
      return screen.state satisfies never;
  }
}

export function BootstrapScreen({
  platform,
  bootstrap,
  progress,
  onBiometricIntent,
  lockLost = false,
}: BootstrapScreenProps) {
  const { t } = useTranslation();
  const screen = useBootstrapScreen(bootstrap, onBiometricIntent);
  const fileSystem = platform.fileSystem as FileSystemService;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt p-lg">
      {/* max-w-112 (28rem), not max-w-md: @repo/ui's --spacing-md token (theme.css) collides with
          Tailwind's named md container scale, silently resolving max-w-md to 1rem instead of 28rem
          — the numbered scale sidesteps the collision (see EmptyState.tsx's max-w-80 for the same fix). */}
      <div className="w-full max-w-112">
        <Panel title={t('bootstrap:picker.title')}>
          {lockLost && screen.state.kind === 'needs-unlock' && (
            <p role="alert" className="mb-4 text-body-sm text-neg">
              {t('bootstrap:unlock.lockLost')}
            </p>
          )}
          {renderBootstrapBody(screen, fileSystem, platform.biometricUnlock, progress, t)}
        </Panel>
      </div>
    </div>
  );
}
