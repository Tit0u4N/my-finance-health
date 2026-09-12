// @repo/routes — level 3.
// View for the Investments (list) screen (screens.md) — JSX and @repo/ui composition only, all
// data and handlers come from useInvestmentsScreen. useTranslation is allowed here for static
// copy — everything derived (plurals, interpolation) stays in the ViewModel.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { AmountValue } from '@repo/ui/components/AmountValue';
import { Avatar } from '@repo/ui/components/Avatar';
import { Button } from '@repo/ui/components/Button';
import { ColorSwatchPicker } from '@repo/ui/components/ColorSwatchPicker';
import { ConfirmDialog } from '@repo/ui/components/ConfirmDialog';
import { Content } from '@repo/ui/components/Content';
import { Donut } from '@repo/ui/components/charts/Donut';
import { LineChart } from '@repo/ui/components/charts/LineChart';
import { Dialog } from '@repo/ui/components/Dialog';
import { DropdownMenu } from '@repo/ui/components/DropdownMenu';
import { EmptyState } from '@repo/ui/components/EmptyState';
import { Input } from '@repo/ui/components/Input';
import { PageHeader } from '@repo/ui/components/PageHeader';
import { Panel } from '@repo/ui/components/Panel';
import { Select } from '@repo/ui/components/Select';
import { StatTile } from '@repo/ui/components/StatTile';
import { Table } from '@repo/ui/components/Table';
import { Td } from '@repo/ui/components/Td';
import { CirclePlus, LineChart as LineChartIcon, MoreVertical, Pencil, Plus, Trash2, TrendingUp } from 'lucide-react';
import type { InvestmentSortKey } from './useInvestmentsScreen';
import { useInvestmentsScreen } from './useInvestmentsScreen';

const KPI_ICON_COLOR: Record<string, string> = {
  value: 'var(--mfh-accent)',
  cost: 'var(--mfh-muted)',
  profitLoss: 'var(--mfh-pos)',
};

export function InvestmentsScreen() {
  const { t } = useTranslation();
  const screen = useInvestmentsScreen();

  if (!screen.ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-body text-muted">
        {t('common:state.loadingWorkspace')}
      </div>
    );
  }

  const {
    hidden,
    subtitle,
    kpis,
    trendTitle,
    trend,
    trendColor,
    curve,
    curveOptions,
    onCurveChange,
    donutData,
    donutCenterLabel,
    donutCenterValue,
    legend,
    rows,
    sortKey,
    sortDirection,
    onSortChange,
    onOpenInvestment,
    onEdit,
    onRecordValue,
    onDelete,
    form,
    recordValueForm,
    deleteDialog,
  } = screen;

  return (
    <>
      <PageHeader
        title={t('investments:list.title')}
        subtitle={subtitle}
        actions={
          <Button tone="primary" size="sm" icon={Plus} onClick={screen.onCreate}>
            {t('investments:list.addPosition')}
          </Button>
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
              value={<AmountValue value={kpi.valueLabel} hidden={hidden} tone={kpi.hero ? 'onAccent' : 'default'} />}
              sub={kpi.sub}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel
            title={trendTitle}
            subtitle={t('investments:list.pastMonth')}
            className="lg:col-span-2"
            right={
              <Select
                value={curve}
                onValueChange={onCurveChange}
                options={curveOptions}
                ariaLabel={t('investments:list.curveAriaLabel')}
                className="h-8.5 w-44"
              />
            }
          >
            <LineChart data={trend} color={trendColor} />
          </Panel>

          <Panel title={t('investments:list.allocationTitle')}>
            <div className="flex flex-col items-center gap-4">
              <Donut data={donutData} centerLabel={donutCenterLabel} centerValue={donutCenterValue} />
              <div className="w-full space-y-2">
                {legend.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 text-body-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: entry.color }} />
                    <span className="min-w-0 flex-1 truncate text-foreground">{entry.name}</span>
                    <AmountValue value={entry.valueLabel} hidden={hidden} tone="muted" className="text-caption" />
                    <span className="w-10 text-right text-caption text-subtle">{entry.percentLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <Panel title={t('investments:list.positionsTitle')} bodyClassName="p-1 pt-3">
          {rows.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title={t('investments:list.emptyTitle')}
              subtitle={t('investments:list.emptySubtitle')}
            />
          ) : (
            <Table<InvestmentSortKey>
              minWidth={760}
              head={[
                { label: t('investments:list.column.position') },
                { label: t('investments:list.column.units'), align: 'right', width: 90 },
                { label: t('investments:list.column.avgCost'), align: 'right', width: 100 },
                { label: t('investments:list.column.current'), align: 'right', width: 100 },
                { label: t('investments:list.column.value'), align: 'right', width: 110, sortKey: 'value' },
                { label: t('investments:list.column.profitLoss'), align: 'right', width: 130, sortKey: 'profitLoss' },
                { label: t('investments:list.column.allocation'), align: 'right', width: 100, sortKey: 'allocation' },
                { label: t('investments:list.column.actions'), srOnly: true, width: 44 },
              ]}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            >
              {rows.map((row) => (
                <tr key={row.id} className="h-13">
                  <Td>
                    <button
                      type="button"
                      onClick={() => onOpenInvestment(row.id)}
                      className="flex items-center gap-2.5 text-left"
                    >
                      <Avatar icon={TrendingUp} color={row.color} soft size={28} />
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-caption text-subtle normal-case">{row.ticker}</div>
                      </div>
                    </button>
                  </Td>
                  <Td align="right" muted>
                    {row.qtyLabel}
                  </Td>
                  <Td align="right" muted mono>
                    {row.avgLabel}
                  </Td>
                  <Td align="right" muted mono>
                    {row.currentLabel}
                  </Td>
                  <Td align="right" mono strong>
                    <AmountValue value={row.valueLabel} hidden={hidden} />
                  </Td>
                  <Td align="right" mono>
                    <AmountValue
                      value={row.profitLossLabel}
                      hidden={hidden}
                      tone={row.isPositive ? 'positive' : 'negative'}
                    />
                    <div className="text-caption text-subtle normal-case">{row.profitLossPercentLabel}</div>
                  </Td>
                  <Td align="right" muted>
                    {row.allocationLabel}
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
                        <DropdownMenu.Item icon={LineChartIcon} onClick={() => onRecordValue(row.id)}>
                          {t('investments:action.recordValue')}
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1 h-px bg-border" />
                        <DropdownMenu.Item icon={Trash2} tone="destructive" onClick={() => onDelete(row.id)}>
                          {t('common:action.delete')}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </Content>

      <Dialog
        open={form.isOpen}
        onOpenChange={form.onClose}
        title={form.dialogTitle}
        closeLabel={t('common:action.close')}
        width={520}
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('investments:createDialog.nameLabel')}
              placeholder={t('investments:createDialog.namePlaceholder')}
              value={form.name}
              onChange={(event) => form.onNameChange(event.target.value)}
            />
            <Input
              label={t('investments:createDialog.tickerLabel')}
              placeholder={t('investments:createDialog.tickerPlaceholder')}
              value={form.ticker}
              onChange={(event) => form.onTickerChange(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t('investments:createDialog.unitsLabel')}
              placeholder="0"
              inputMode="decimal"
              value={form.qty}
              onChange={(event) => form.onQtyChange(event.target.value)}
            />
            <Input
              label={t('investments:createDialog.avgCostLabel')}
              placeholder="0.00"
              inputMode="decimal"
              value={form.avg}
              onChange={(event) => form.onAvgChange(event.target.value)}
            />
            {form.mode === 'create' && (
              <Input
                label={t('investments:createDialog.currentPriceLabel')}
                placeholder="0.00"
                inputMode="decimal"
                value={form.current}
                onChange={(event) => form.onCurrentChange(event.target.value)}
              />
            )}
          </div>
          <div>
            <span className="text-label text-muted">{t('investments:createDialog.colourLabel')}</span>
            <div className="mt-2">
              <ColorSwatchPicker
                value={form.color}
                onChange={form.onColorChange}
                ariaLabel={t('investments:createDialog.colourAriaLabel')}
              />
            </div>
          </div>
          {form.errorMessage && <span className="text-body-sm text-neg">{form.errorMessage}</span>}
        </div>
      </Dialog>

      <Dialog
        open={recordValueForm.isOpen}
        onOpenChange={recordValueForm.onClose}
        title={recordValueForm.dialogTitle}
        closeLabel={t('common:action.close')}
        width={420}
        actions={
          <>
            <Button tone="secondary" size="sm" onClick={recordValueForm.onClose}>
              {t('common:action.cancel')}
            </Button>
            <Button
              tone="primary"
              size="sm"
              icon={CirclePlus}
              onClick={recordValueForm.onSubmit}
              disabled={!recordValueForm.canSubmit}
            >
              {t('investments:recordValueDialog.submit')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label={t('investments:recordValueDialog.dateLabel')}
            type="date"
            value={recordValueForm.date}
            onChange={(event) => recordValueForm.onDateChange(event.target.value)}
          />
          <Input
            label={t('investments:recordValueDialog.priceLabel')}
            placeholder="0.00"
            inputMode="decimal"
            value={recordValueForm.price}
            onChange={(event) => recordValueForm.onPriceChange(event.target.value)}
          />
          {recordValueForm.errorMessage && (
            <span className="text-body-sm text-neg">{recordValueForm.errorMessage}</span>
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.onClose}
        title={deleteDialog.title}
        description={t('investments:deleteConfirm.description')}
        confirmLabel={t('common:action.delete')}
        cancelLabel={t('common:action.cancel')}
        onConfirm={deleteDialog.onConfirm}
        isPending={deleteDialog.isSubmitting}
      />
    </>
  );
}
