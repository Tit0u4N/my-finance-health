// @repo/routes — level 3.
// View for Settings → Database (screens.md) — JSX and @repo/ui composition only.

import { Button } from '@repo/ui/components/Button';
import { EmptyState } from '@repo/ui/components/EmptyState';
import { Panel } from '@repo/ui/components/Panel';
import { Database, Trash2 } from 'lucide-react';
import { useDatabaseScreen } from './useDatabaseScreen';

export function DatabaseScreen() {
  const screen = useDatabaseScreen();

  if (!screen.ready) {
    return <div className="text-body text-muted">Loading…</div>;
  }

  if (!screen.isAvailable) {
    return (
      <Panel>
        <EmptyState
          icon={Database}
          title="Not available on this platform"
          subtitle="Database management needs local file access, which this build doesn't have."
        />
      </Panel>
    );
  }

  const { path, metadata, actions } = screen;

  return (
    <>
      <Panel title="Active file" subtitle="Everything lives in this single file">
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

      <Panel title="Danger zone" subtitle="These actions cannot be undone">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-label-strong text-neg">Reset all data</div>
            <div className="mt-0.5 text-body-sm text-muted leading-relaxed">
              Wipes transactions, accounts and investments. The file itself stays on disk.
            </div>
          </div>
          <Button tone="destruct" size="sm" icon={Trash2} disabled>
            Reset everything
          </Button>
        </div>
      </Panel>
    </>
  );
}
