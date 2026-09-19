// @repo/routes — level 3.
// View for Settings → Database (screens.md) — JSX and @repo/ui composition only. useTranslation is
// allowed here for static copy — everything derived (plurals, interpolation) stays in the
// ViewModel.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { Button } from '@repo/ui/components/Button';
import { EmptyState } from '@repo/ui/components/EmptyState';
import { Panel } from '@repo/ui/components/Panel';
import { Database, Lock, Trash2 } from 'lucide-react';
import { useDatabaseScreen } from './useDatabaseScreen';

export function DatabaseScreen() {
  const { t } = useTranslation();
  const screen = useDatabaseScreen();

  if (!screen.ready) {
    return <div className="text-body text-muted">{t('common:state.loading')}</div>;
  }

  if (!screen.isAvailable) {
    return (
      <Panel>
        <EmptyState
          icon={Database}
          title={t('settings:database.emptyState.title')}
          subtitle={t('settings:database.emptyState.subtitle')}
        />
      </Panel>
    );
  }

  const { path, metadata, actions, canLock, onLock } = screen;

  return (
    <>
      {canLock && (
        <Panel
          title={t('settings:database.sessionPanel.title')}
          subtitle={t('settings:database.sessionPanel.subtitle')}
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 text-body-sm text-muted">{t('settings:database.lockWorkspace.description')}</div>
            <Button tone="secondary" size="sm" icon={Lock} onClick={onLock}>
              {t('settings:database.lockWorkspace.label')}
            </Button>
          </div>
        </Panel>
      )}

      <Panel
        title={t('settings:database.activeFilePanel.title')}
        subtitle={t('settings:database.activeFilePanel.subtitle')}
      >
        <div className="rounded-md border border-border bg-chip-bg px-3.5 py-3 font-mono text-body-sm text-foreground">
          {path}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {metadata.map((entry) => (
            <div key={entry.label}>
              <div className="text-caption text-subtle">{entry.label}</div>
              <div className="mt-1 text-foreground text-label-strong tabular-nums">{entry.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4.5 flex gap-2.5">
          {actions.map((action) => (
            <Button key={action.id} tone="secondary" size="sm" icon={action.icon} disabled>
              {action.label}
            </Button>
          ))}
        </div>
      </Panel>

      <Panel
        title={t('settings:database.dangerZonePanel.title')}
        subtitle={t('settings:database.dangerZonePanel.subtitle')}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-label-strong text-neg">{t('settings:database.resetAllData.label')}</div>
            <div className="mt-0.5 text-body-sm text-muted leading-relaxed">
              {t('settings:database.resetAllData.description')}
            </div>
          </div>
          <Button tone="destruct" size="sm" icon={Trash2} disabled>
            {t('settings:database.resetEverything')}
          </Button>
        </div>
      </Panel>
    </>
  );
}
