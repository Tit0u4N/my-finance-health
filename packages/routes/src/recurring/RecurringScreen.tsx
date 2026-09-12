// @repo/routes — level 3.
// View for the Recurring screen (screens.md) — JSX and @repo/ui composition only, all data and
// handlers come from useRecurringScreen. useTranslation is allowed here for static copy —
// everything derived (plurals, interpolation) stays in the ViewModel.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { AccountFilter } from '@repo/ui/components/AccountFilter';
import { AmountValue } from '@repo/ui/components/AmountValue';
import { Avatar } from '@repo/ui/components/Avatar';
import { Button } from '@repo/ui/components/Button';
import { CategoryChips } from '@repo/ui/components/CategoryChips';
import { ConfirmDialog } from '@repo/ui/components/ConfirmDialog';
import { Content } from '@repo/ui/components/Content';
import { Dialog } from '@repo/ui/components/Dialog';
import { DropdownMenu } from '@repo/ui/components/DropdownMenu';
import { EmptyState } from '@repo/ui/components/EmptyState';
import { Input } from '@repo/ui/components/Input';
import { PageHeader } from '@repo/ui/components/PageHeader';
import { Panel } from '@repo/ui/components/Panel';
import { Select } from '@repo/ui/components/Select';
import { StatTile } from '@repo/ui/components/StatTile';
import { Switch } from '@repo/ui/components/Switch';
import { Table } from '@repo/ui/components/Table';
import { Tabs } from '@repo/ui/components/Tabs';
import { Td } from '@repo/ui/components/Td';
import { cn } from '@repo/ui/lib/cn';
import { MoreVertical, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { useRecurringScreen } from './useRecurringScreen';

const KPI_ICON_COLOR: Record<string, string> = {
  in: 'var(--mfh-pos)',
  out: 'var(--mfh-neg)',
  net: 'var(--mfh-accent)',
};

export function RecurringScreen() {
  const { t } = useTranslation();
  const screen = useRecurringScreen();

  if (!screen.ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-body text-muted">
        {t('common:state.loadingWorkspace')}
      </div>
    );
  }

  const { hidden, subtitle, kpis, rows, rowCountLabel, onToggleActive, onEdit, onDelete, form, deleteDialog } = screen;

  return (
    <>
      <PageHeader
        title={t('recurring:list.title')}
        subtitle={subtitle}
        actions={
          <>
            <AccountFilter {...screen.accountFilter} hidden={hidden} />
            <Button tone="primary" size="sm" icon={Plus} onClick={screen.onCreate}>
              {t('recurring:list.addRule')}
            </Button>
          </>
        }
      />
      <Content>
        <div className="grid-kpi">
          {kpis.map((kpi) => (
            <StatTile
              key={kpi.id}
              label={kpi.label}
              hero={kpi.hero}
              icon={kpi.icon}
              iconColor={KPI_ICON_COLOR[kpi.id]}
              value={kpi.id === 'active' ? kpi.valueLabel : <AmountValue value={kpi.valueLabel} hidden={hidden} />}
            />
          ))}
        </div>

        <Panel title={t('recurring:list.panelTitle')} subtitle={rowCountLabel} bodyClassName="p-1 pt-3">
          {rows.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title={t('recurring:list.emptyTitle')}
              subtitle={t('recurring:list.emptySubtitle')}
            />
          ) : (
            <Table
              minWidth={840}
              head={[
                { label: t('recurring:list.columnRule') },
                { label: t('common:column.category'), width: 140 },
                { label: t('recurring:list.columnAccount'), width: 110 },
                { label: t('recurring:list.columnFrequency'), width: 100 },
                { label: t('recurring:list.columnNext'), width: 130 },
                { label: t('common:column.amount'), align: 'right', width: 120 },
                { label: t('recurring:list.columnMonthly'), align: 'right', width: 110 },
                { label: t('recurring:list.columnActive'), width: 60 },
                { label: t('recurring:list.columnActions'), srOnly: true, width: 44 },
              ]}
            >
              {rows.map((row) => {
                const CategoryIcon = row.categoryIcon;
                return (
                  <tr key={row.id} className={cn('h-13', !row.isActive && 'opacity-60')}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar icon={CategoryIcon} color={row.categoryColor} soft size={28} />
                        <span className="font-medium">{row.desc}</span>
                      </div>
                    </Td>
                    <Td muted>{row.categoryName}</Td>
                    <Td muted>{row.accountName}</Td>
                    <Td muted>{row.freqLabel}</Td>
                    <Td muted>
                      <div>{row.nextLabel}</div>
                      <div className="text-caption text-subtle normal-case">{row.nextRelativeLabel}</div>
                    </Td>
                    <Td align="right" mono strong>
                      <AmountValue
                        value={row.amountLabel}
                        hidden={hidden}
                        tone={row.isPositive ? 'positive' : 'default'}
                      />
                    </Td>
                    <Td align="right" mono muted>
                      <AmountValue value={row.monthlyLabel} hidden={hidden} tone="muted" />
                    </Td>
                    <Td>
                      <Switch
                        checked={row.isActive}
                        onCheckedChange={(active) => onToggleActive(row.id, active)}
                        aria-label={row.activeAriaLabel}
                      />
                    </Td>
                    <Td align="right">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                          aria-label={row.actionsAriaLabel}
                          className="flex h-7 w-7 items-center justify-center rounded-sm text-subtle hover:bg-chip-bg"
                        >
                          <MoreVertical size={14} />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                          <DropdownMenu.Item icon={Pencil} onClick={() => onEdit(row.id)}>
                            {t('common:action.edit')}
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="my-1 h-px bg-border" />
                          <DropdownMenu.Item icon={Trash2} tone="destructive" onClick={() => onDelete(row.id)}>
                            {t('common:action.delete')}
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Panel>
      </Content>

      <Dialog
        open={form.isOpen}
        onOpenChange={form.onClose}
        title={form.dialogTitle}
        closeLabel={t('common:action.close')}
        width={560}
        actions={
          <>
            <Button tone="secondary" size="sm" onClick={form.onClose}>
              {t('common:action.cancel')}
            </Button>
            <Button tone="primary" size="sm" onClick={form.onSubmit} disabled={!form.canSubmit}>
              {form.submitLabel}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Tabs
            value={form.kind}
            onValueChange={form.onKindChange}
            items={form.kindOptions}
            ariaLabel={t('recurring:dialog.typeAriaLabel')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('recurring:dialog.amountLabel')}
              placeholder="0.00"
              inputMode="decimal"
              value={form.amount}
              onChange={(event) => form.onAmountChange(event.target.value)}
            />
            <Select
              label={t('recurring:dialog.freqLabel')}
              value={form.freq}
              onValueChange={form.onFreqChange}
              options={form.freqOptions}
            />
          </div>
          <Input
            label={t('recurring:dialog.descLabel')}
            placeholder={t('recurring:dialog.descPlaceholder')}
            value={form.desc}
            onChange={(event) => form.onDescChange(event.target.value)}
          />
          <div>
            <span className="text-label text-muted">{t('recurring:dialog.categoryLabel')}</span>
            <div className="mt-2">
              <CategoryChips
                items={form.categoryChips}
                value={form.categoryId}
                onChange={form.onCategoryChange}
                ariaLabel={t('recurring:dialog.categoryLabel')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('recurring:dialog.accountLabel')}
              value={form.accountId}
              onValueChange={form.onAccountChange}
              options={form.accountOptions}
            />
            <Input
              label={t('recurring:dialog.startDateLabel')}
              type="date"
              value={form.startDate}
              onChange={(event) => form.onStartDateChange(event.target.value)}
            />
          </div>
          {form.errorMessage && <span className="text-body-sm text-neg">{form.errorMessage}</span>}
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.onClose}
        title={deleteDialog.title}
        description={t('recurring:deleteDialog.description')}
        confirmLabel={t('common:action.delete')}
        cancelLabel={t('common:action.cancel')}
        onConfirm={deleteDialog.onConfirm}
        isPending={deleteDialog.isSubmitting}
      />
    </>
  );
}
