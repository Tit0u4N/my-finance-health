import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { type StarterCategoryRow, useStarterCategories } from '@repo/app-core/starter/useStarterCategories';
import { Button } from '@repo/ui/components/Button';
import { Checkbox } from '@repo/ui/components/Checkbox';
import { Panel } from '@repo/ui/components/Panel';

export type StarterCategoriesProps = {
  /** Called once the step is finished or skipped — the app then shows the main screens. */
  readonly onDone: () => void;
};

/** Shown once, right after a workspace is created (audit P1). Logic lives in
 * `@repo/app-core`'s `useStarterCategories`, shared with mobile. */
export function StarterCategories({ onDone }: StarterCategoriesProps) {
  const { t } = useTranslation();
  const starter = useStarterCategories(onDone);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt p-lg">
      <div className="w-full max-w-112">
        <Panel title={t('bootstrap:starter.title')}>
          <div className="flex flex-col gap-4">
            <p className="text-body-sm text-muted">{t('bootstrap:starter.hint')}</p>
            <div className="grid grid-cols-2 gap-4">
              <Column title={t('bootstrap:starter.income')} rows={starter.income} onToggle={starter.onToggle} />
              <Column title={t('bootstrap:starter.expense')} rows={starter.expense} onToggle={starter.onToggle} />
            </div>
            {starter.hasError && <span className="text-body-sm text-neg">{t('bootstrap:starter.error')}</span>}
            <div className="flex flex-col gap-2">
              <Button fullWidth disabled={starter.isSaving} onClick={() => void starter.onConfirm()}>
                {starter.selectedCount === 0
                  ? t('bootstrap:starter.confirmNone')
                  : t('bootstrap:starter.confirm', { count: starter.selectedCount })}
              </Button>
              {starter.selectedCount > 0 && (
                <Button fullWidth tone="secondary" disabled={starter.isSaving} onClick={starter.onSkip}>
                  {t('bootstrap:starter.skip')}
                </Button>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Column({
  title,
  rows,
  onToggle,
}: {
  readonly title: string;
  readonly rows: readonly StarterCategoryRow[];
  readonly onToggle: (key: StarterCategoryRow['key']) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold text-foreground">{title}</span>
      {rows.map((row) => (
        <label key={row.key} className="flex items-center gap-sm text-body-sm text-foreground">
          <Checkbox checked={row.enabled} onCheckedChange={() => onToggle(row.key)} />
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
          {row.name}
        </label>
      ))}
    </div>
  );
}
