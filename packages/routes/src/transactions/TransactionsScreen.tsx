// @repo/routes — level 3.
// View for the Transactions (ledger) screen (screens.md) — JSX and @repo/ui composition only,
// all data and handlers come from useTransactionsScreen.

import type { TransactionSortKey } from '@repo/domain/repositories/criteria';
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
import { Table } from '@repo/ui/components/Table';
import { Tabs } from '@repo/ui/components/Tabs';
import { Td } from '@repo/ui/components/Td';
import { MoreVertical, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { useTransactionsScreen } from './useTransactionsScreen';

const KPI_ICON_COLOR: Record<string, string> = {
  inflow: 'var(--mfh-pos)',
  outflow: 'var(--mfh-neg)',
  net: 'var(--mfh-accent)',
};

export function TransactionsScreen() {
  const screen = useTransactionsScreen();

  if (!screen.ready) {
    return <div className="flex flex-1 items-center justify-center text-body text-muted">Loading your workspace…</div>;
  }

  const { hidden, subtitle, isFiltering, kpis, filters, rows, rowCountLabel, onEdit, onDelete, form, deleteDialog } =
    screen;

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={subtitle}
        actions={
          <>
            <AccountFilter {...screen.accountFilter} hidden={hidden} />
            <Button tone="primary" size="sm" icon={Plus} onClick={screen.onCreate}>
              New transaction
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
          title="All transactions"
          subtitle={rowCountLabel}
          bodyClassName="p-1 pt-3"
          right={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Input
                icon={Search}
                placeholder="Search description…"
                className="h-8.5 w-52"
                value={filters.searchValue}
                onChange={(event) => filters.onSearchChange(event.target.value)}
              />
              <Select
                value={filters.type}
                onValueChange={filters.onTypeChange}
                options={filters.typeOptions}
                ariaLabel="Type"
                className="h-8.5 w-32"
              />
              <Select
                value={filters.category}
                onValueChange={filters.onCategoryChange}
                options={filters.categoryOptions}
                ariaLabel="Category"
                className="h-8.5 w-40"
              />
              <Button tone="ghost" size="sm" onClick={filters.onReset} disabled={!filters.isFiltered}>
                Reset
              </Button>
            </div>
          }
        >
          {rows.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions match"
              subtitle="Try a different search, type or category filter."
            />
          ) : (
            <div className={isFiltering ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <Table<TransactionSortKey>
                minWidth={720}
                head={[
                  { label: 'Description' },
                  { label: 'Category', width: 150 },
                  { label: 'Account', width: 120 },
                  { label: 'Date', width: 110, sortKey: 'date' },
                  { label: 'Amount', align: 'right', width: 130, sortKey: 'amount' },
                  { label: 'Actions', srOnly: true, width: 44 },
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
                            aria-label={`Actions — ${row.desc}`}
                            className="flex h-7 w-7 items-center justify-center rounded-sm text-subtle hover:bg-chip-bg"
                          >
                            <MoreVertical size={14} />
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content>
                            <DropdownMenu.Item icon={Pencil} onClick={() => onEdit(row.id)}>
                              Edit
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="my-1 h-px bg-border" />
                            <DropdownMenu.Item icon={Trash2} tone="destructive" onClick={() => onDelete(row.id)}>
                              Delete
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
        title={form.mode === 'create' ? 'New transaction' : 'Edit transaction'}
        width={560}
        actions={
          <>
            <Button tone="secondary" size="sm" onClick={form.onClose}>
              Cancel
            </Button>
            <Button tone="primary" size="sm" onClick={form.onSubmit} disabled={!form.canSubmit}>
              {form.mode === 'create' ? 'Create transaction' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Tabs value={form.kind} onValueChange={form.onKindChange} items={form.kindOptions} ariaLabel="Type" />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount"
              placeholder="0.00"
              inputMode="decimal"
              value={form.amount}
              onChange={(event) => form.onAmountChange(event.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(event) => form.onDateChange(event.target.value)}
            />
          </div>
          <Input
            label="Description"
            placeholder="e.g. Carrefour Market"
            value={form.desc}
            onChange={(event) => form.onDescChange(event.target.value)}
          />
          <div>
            <span className="text-label text-muted">Category</span>
            <div className="mt-2">
              <CategoryChips
                items={form.categoryChips}
                value={form.categoryId}
                onChange={form.onCategoryChange}
                ariaLabel="Category"
              />
            </div>
          </div>
          <Select
            label="Account"
            value={form.accountId}
            onValueChange={form.onAccountChange}
            options={form.accountOptions}
          />
          <Input
            label="Note (optional)"
            placeholder="Add a note"
            value={form.note}
            onChange={(event) => form.onNoteChange(event.target.value)}
          />
          {form.errorMessage && <span className="text-body-sm text-neg">{form.errorMessage}</span>}
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.onClose}
        title={`Delete "${deleteDialog.desc}"?`}
        description={`This transaction (${deleteDialog.amountLabel}) will be permanently removed and the account balance updated.`}
        confirmLabel="Delete"
        onConfirm={deleteDialog.onConfirm}
        isPending={deleteDialog.isSubmitting}
      />
    </>
  );
}
