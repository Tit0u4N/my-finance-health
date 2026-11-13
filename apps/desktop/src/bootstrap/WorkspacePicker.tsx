import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import type { LocalWorkspaceRef, WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { Button } from '@repo/ui/components/Button';
import { EmptyState } from '@repo/ui/components/EmptyState';
import { FolderOpen } from 'lucide-react';
import { useWorkspacePicker } from './useWorkspacePicker';

export type WorkspacePickerProps = {
  readonly recent: readonly WorkspaceRef[];
  readonly fileSystem: FileSystemService;
  readonly onOpen: (ref: WorkspaceRef) => void;
  readonly onStartCreate: () => void;
};

export function WorkspacePicker({ recent, fileSystem, onOpen, onStartCreate }: WorkspacePickerProps) {
  const { t } = useTranslation();
  const { onBrowse, error } = useWorkspacePicker({ fileSystem, onOpen });
  const localRecent = recent.filter((entry): entry is LocalWorkspaceRef => entry.mode === 'local');

  return (
    <div className="flex flex-col gap-4">
      {localRecent.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-label text-muted">{t('bootstrap:picker.recent')}</span>
          {localRecent.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpen(entry)}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3.5 py-2.5 text-left hover:bg-surface-alt"
            >
              <span className="truncate text-body-sm text-foreground">{entry.label}</span>
              <span className="truncate text-subtle text-xs">{entry.path}</span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title={t('bootstrap:picker.noRecentTitle')}
          subtitle={t('bootstrap:picker.noRecentSubtitle')}
        />
      )}
      {error && <span className="text-body-sm text-neg">{error}</span>}
      <div className="flex gap-2">
        <Button tone="secondary" fullWidth onClick={onBrowse}>
          {t('bootstrap:picker.openFile')}
        </Button>
        <Button tone="primary" fullWidth onClick={onStartCreate}>
          {t('bootstrap:picker.createNew')}
        </Button>
      </div>
    </div>
  );
}
