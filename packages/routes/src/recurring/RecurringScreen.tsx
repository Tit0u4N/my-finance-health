// @repo/routes — level 3.
// View for the Recurring screen (screens.md) — JSX and @repo/ui composition only, all data and
// handlers come from useRecurringScreen.

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
  const screen = useRecurringScreen();

  if (!screen.ready) {
    return <div className="flex flex-1 items-center justify-center text-body text-muted">Loading your workspace…</div>;
  }

  const { hidden, subtitle, kpis, rows, rowCountLabel, onToggleActive, onEdit, onDelete, form, deleteDialog } = screen;

  return (
    <>
      <PageHeader
        title="Recurring"
        subtitle={subtitle}
        actions={
          <>
            <AccountFilter {...screen.accountFilter} hidden={hidden} />
            <Button tone="primary" size="sm" icon={Plus} onClick={screen.onCreate}>
              New rule
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

        <Panel title="Rules" subtitle={rowCountLabel} bodyClassName="p-1 pt-3">
          {rows.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No recurring rules"
              subtitle="Rules on the accounts in scope will show up here."
            />
          ) : (
            <Table
              minWidth={840}
              head={[
                { label: 'Rule' },
                { label: 'Category', width: 140 },
                { label: 'Account', width: 110 },
                { label: 'Frequency', width: 100 },
                { label: 'Next', width: 130 },
                { label: 'Amount', align: 'right', width: 120 },
                { label: 'Monthly', align: 'right', width: 110 },
                { label: 'Active', width: 60 },
                { label: 'Actions', srOnly: true, width: 44 },
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
                        aria-label={`Active — ${row.desc}`}
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
          )}
        </Panel>
      </Content>

      <Dialog
        open={form.isOpen}
        onOpenChange={form.onClose}
        title={form.mode === 'create' ? 'New recurring rule' : 'Edit recurring rule'}
        width={560}
        actions={
          <>
            <Button tone="secondary" size="sm" onClick={form.onClose}>
              Cancel
            </Button>
            <Button tone="primary" size="sm" onClick={form.onSubmit} disabled={!form.canSubmit}>
              {form.mode === 'create' ? 'Create rule' : 'Save changes'}
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
            <Select label="Frequency" value={form.freq} onValueChange={form.onFreqChange} options={form.freqOptions} />
          </div>
          <Input
            label="Description"
            placeholder="e.g. Rent"
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
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Account"
              value={form.accountId}
              onValueChange={form.onAccountChange}
              options={form.accountOptions}
            />
            <Input
              label="Start date"
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
        title={`Delete "${deleteDialog.desc}"?`}
        description="This recurring rule will be permanently removed. Existing transactions are not affected."
        confirmLabel="Delete"
        onConfirm={deleteDialog.onConfirm}
        isPending={deleteDialog.isSubmitting}
      />
    </>
  );
}
