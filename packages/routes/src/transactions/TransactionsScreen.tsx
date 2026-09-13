// @repo/routes — level 3.
// View for the Transactions (ledger) screen (screens.md) — JSX and @repo/ui composition only,
// all data and handlers come from useTransactionsScreen. useTranslation is allowed here for
// static copy — everything derived (plurals, interpolation) stays in the ViewModel.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import type { TransactionSortKey } from '@repo/domain/repositories/criteria';
import { AccountFilter } from '@repo/ui/components/AccountFilter';
import { AmountValue } from '@repo/ui/components/AmountValue';
import { Autocomplete } from '@repo/ui/components/Autocomplete';
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
import { Table } from '@repo/ui/components/Table';
import { Tabs } from '@repo/ui/components/Tabs';
import { Td } from '@repo/ui/components/Td';
import { MoreVertical, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { DateField } from '../shared/DateField';
import { useTransactionsScreen } from './useTransactionsScreen';

const KPI_ICON_COLOR: Record<string, string> = {
  inflow: 'var(--mfh-pos)',
  outflow: 'var(--mfh-neg)',
  net: 'var(--mfh-accent)',
};

export function TransactionsScreen() {
  const { t } = useTranslation();
  const screen = useTransactionsScreen();

  if (!screen.ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-body text-muted">
        {t('common:state.loadingWorkspace')}
      </div>
    );
  }

  const { hidden, subtitle, isFiltering, kpis, filters, rows, rowCountLabel, onEdit, onDelete, form, deleteDialog } =
    screen;

  return (
    <>
      <PageHeader
        title={t('transactions:list.title')}
        subtitle={subtitle}
        actions={
          <>
            <AccountFilter {...screen.accountFilter} hidden={hidden} />
            <Button tone="primary" size="sm" icon={Plus} onClick={screen.onCreate}>
              {t('transactions:list.addTransaction')}
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
              icon={kpi.icon}
              iconColor={KPI_ICON_COLOR[kpi.id]}
              value={<AmountValue value={kpi.valueLabel} hidden={hidden} />}
            />
          ))}
        </div>

        <Panel
          title={t('transactions:list.panelTitle')}
          subtitle={rowCountLabel}
          bodyClassName="p-1 pt-3"
          right={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Input
                icon={Search}
                placeholder={t('transactions:list.searchPlaceholder')}
                className="h-8.5 w-52"
                value={filters.searchValue}
                onChange={(event) => filters.onSearchChange(event.target.value)}
              />
              <Select
                value={filters.type}
                onValueChange={filters.onTypeChange}
                options={filters.typeOptions}
                ariaLabel={t('transactions:list.typeAriaLabel')}
                className="h-8.5 w-32"
              />
              <Select
                value={filters.category}
                onValueChange={filters.onCategoryChange}
                options={filters.categoryOptions}
                ariaLabel={t('transactions:list.categoryAriaLabel')}
                className="h-8.5 w-40"
              />
              <Button tone="ghost" size="sm" onClick={filters.onReset} disabled={!filters.isFiltered}>
                {t('transactions:list.reset')}
              </Button>
            </div>
          }
        >
          {rows.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t('transactions:list.emptyTitle')}
              subtitle={t('transactions:list.emptySubtitle')}
            />
          ) : (
            <div className={isFiltering ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <Table<TransactionSortKey>
                minWidth={720}
                head={[
                  { label: t('common:column.description') },
                  { label: t('common:column.category'), width: 150 },
                  { label: t('transactions:list.columnAccount'), width: 120 },
                  { label: t('common:column.date'), width: 110, sortKey: 'date' },
                  { label: t('common:column.amount'), align: 'right', width: 130, sortKey: 'amount' },
                  { label: t('transactions:list.columnActions'), srOnly: true, width: 44 },
                ]}
                sortKey={filters.sortKey}
                sortDirection={filters.sortDirection}
                onSortChange={filters.onSortChange}
              >
                {rows.map((row) => {
                  const CategoryIcon = row.categoryIcon;
                  return (
                    <tr key={row.id} className="h-13">
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar icon={CategoryIcon} color={row.categoryColor} soft size={28} />
                          <span className="font-medium">{row.desc}</span>
                        </div>
                      </Td>
                      <Td muted>{row.categoryName}</Td>
                      <Td muted>{row.accountName}</Td>
                      <Td muted>{row.dateLabel}</Td>
                      <Td align="right" mono strong>
                        <AmountValue
                          value={row.amountLabel}
                          hidden={hidden}
                          tone={row.isPositive ? 'positive' : 'default'}
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
            </div>
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
            ariaLabel={t('transactions:dialog.typeAriaLabel')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('transactions:dialog.amountLabel')}
              placeholder="0.00"
              inputMode="decimal"
              value={form.amount}
              onChange={(event) => form.onAmountChange(event.target.value)}
            />
            <DateField label={t('transactions:dialog.dateLabel')} value={form.date} onValueChange={form.onDateChange} />
          </div>
          <Autocomplete
            label={t('transactions:dialog.descLabel')}
            placeholder={t('transactions:dialog.descPlaceholder')}
            value={form.desc}
            onValueChange={form.onDescChange}
            items={form.descSuggestions}
            emptyLabel={t('transactions:dialog.descNoSuggestions')}
          />
          <div>
            <span className="text-label text-muted">{t('transactions:dialog.categoryLabel')}</span>
            <div className="mt-2">
              <CategoryChips
                items={form.categoryChips}
                value={form.categoryId}
                onChange={form.onCategoryChange}
                ariaLabel={t('transactions:dialog.categoryLabel')}
              />
            </div>
          </div>
          <Select
            label={t('transactions:dialog.accountLabel')}
            value={form.accountId}
            onValueChange={form.onAccountChange}
            options={form.accountOptions}
          />
          <Input
            label={t('transactions:dialog.noteLabel')}
            placeholder={t('transactions:dialog.notePlaceholder')}
            value={form.note}
            onChange={(event) => form.onNoteChange(event.target.value)}
          />
          {form.errorMessage && <span className="text-body-sm text-neg">{form.errorMessage}</span>}
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.onClose}
        title={deleteDialog.title}
        description={deleteDialog.description}
        confirmLabel={t('common:action.delete')}
        cancelLabel={t('common:action.cancel')}
        onConfirm={deleteDialog.onConfirm}
        isPending={deleteDialog.isSubmitting}
      />
    </>
  );
}
