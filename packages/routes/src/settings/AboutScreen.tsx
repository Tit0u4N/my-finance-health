// @repo/routes — level 3.
// View for Settings → About (screens.md: "Static app info… hardcoded strings"). No ViewModel —
// zero data-fetching hooks, module-level constants; a hook that only returns constants is ceremony
// CLAUDE.md's "logic-free primitives stay in one file" argues against. useTranslation is called
// directly here for the same reason — this View has no ViewModel to own it instead.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { Badge } from '@repo/ui/components/Badge';
import { Panel } from '@repo/ui/components/Panel';
import { Lock } from 'lucide-react';

const VERSION = '1.2.0';
const FACT_KEYS = ['storage', 'sync', 'telemetry'] as const;

export function AboutScreen() {
  const { t } = useTranslation();
  const facts = FACT_KEYS.map((key) => ({
    label: t(`settings:about.facts.${key}.label`),
    value: t(`settings:about.facts.${key}.value`),
  }));

  return (
    <Panel title={t('settings:about.panelTitle')} subtitle={t('settings:about.panelSubtitle')}>
      <div className="flex items-center gap-3.5">
        <div className="flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-strong font-bold text-white text-xl">
          M
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-foreground text-label-strong">{t('common:brand.name')}</div>
          <div className="mt-0.5 text-body-sm text-muted">{t('settings:about.version', { version: VERSION })}</div>
        </div>
        <Badge tone="positive" icon={Lock}>
          {t('settings:about.encryptedAtRest')}
        </Badge>
      </div>
      <div className="mt-5 flex flex-col gap-2.5 border-border border-t pt-4.5">
        {facts.map((fact) => (
          <div key={fact.label} className="flex items-center justify-between text-body-sm">
            <span className="text-muted">{fact.label}</span>
            <span className="font-medium text-foreground">{fact.value}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
