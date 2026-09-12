// @repo/routes — level 3.
// View for the Investment detail screen (screens.md) — JSX and @repo/ui composition only, all
// data and handlers come from useInvestmentDetailScreen. useTranslation is allowed here for
// static copy — everything derived (plurals, interpolation) stays in the ViewModel.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { AmountValue } from '@repo/ui/components/AmountValue';
import { Button } from '@repo/ui/components/Button';
import { ColorSwatchPicker } from '@repo/ui/components/ColorSwatchPicker';
import { ConfirmDialog } from '@repo/ui/components/ConfirmDialog';
import { Content } from '@repo/ui/components/Content';
import { LineChart } from '@repo/ui/components/charts/LineChart';
import { Dialog } from '@repo/ui/components/Dialog';
import { EmptyState } from '@repo/ui/components/EmptyState';
import { Input } from '@repo/ui/components/Input';
import { PageHeader } from '@repo/ui/components/PageHeader';
import { Panel } from '@repo/ui/components/Panel';
import { RangePicker } from '@repo/ui/components/RangePicker';
import { StatTile } from '@repo/ui/components/StatTile';
import { Table } from '@repo/ui/components/Table';
import { Td } from '@repo/ui/components/Td';
import { Textarea } from '@repo/ui/components/Textarea';
import { CirclePlus, History, Pencil, Trash2 } from 'lucide-react';
import { useInvestmentDetailScreen } from './useInvestmentDetailScreen';

const KPI_ICON_COLOR: Record<string, string> = {
  cost: 'var(--mfh-muted)',
  profitLoss: 'var(--mfh-pos)',
  unitProfitLoss: 'var(--mfh-accent)',
};

export function InvestmentDetailScreen() {
  const { t } = useTranslation();
  const screen = useInvestmentDetailScreen();

  if (!screen.ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-body text-muted">
        {t('common:state.loadingWorkspace')}
      </div>
    );
  }

  if (!screen.found) {
    return <PageHeader title={t('common:state.notFound')} back={screen.onBack} />;
  }

  const {
    hidden,
    kpis,
    range,
    rangeOptions,
    onRangeChange,
    trend,
    trendColor,
    note,
    snapshotRows,
    snapshotCountLabel,
    onRecordValue,
    form,
    recordValueForm,
    deleteDialog,
  } = screen;

  return (
    <>
      <PageHeader
        back={screen.onBack}
        eyebrow={screen.eyebrow}
        title={screen.title}
        subtitle={screen.subtitle}
        actions={
          <>
            <Button tone="secondary" size="sm" icon={Pencil} onClick={screen.onEdit}>
              {t('common:action.edit')}
            </Button>
            <Button tone="secondary" size="sm" icon={CirclePlus} onClick={onRecordValue}>
              {t('investments:action.recordValue')}
            </Button>
            <Button tone="destruct" size="sm" icon={Trash2} onClick={deleteDialog.onOpen}>
              {t('investments:detail.deletePosition')}
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
              value={<AmountValue value={kpi.valueLabel} hidden={hidden} tone={kpi.hero ? 'onAccent' : 'default'} />}
              sub={kpi.sub}
            />
          ))}
        </div>

        <Panel
          title={t('investments:detail.priceHistoryTitle')}
          right={
            <RangePicker
              value={range}
              onChange={onRangeChange}
              options={rangeOptions}
              ariaLabel={t('common:label.historyRange')}
            />
          }
        >
          <LineChart data={trend} color={trendColor} />
        </Panel>

        <Panel title={t('investments:detail.notesTitle')}>
          <div className="flex flex-col gap-3">
            <Textarea
              label={t('investments:detail.notesTitle')}
              placeholder={t('investments:detail.notesPlaceholder')}
              value={note.value}
              onChange={(event) => note.onChange(event.target.value)}
            />
            <div className="flex justify-end">
              <Button tone="secondary" size="sm" onClick={note.onSave} disabled={note.isSubmitting}>
                {t('investments:detail.saveNote')}
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title={t('investments:detail.snapshotsTitle')} subtitle={snapshotCountLabel} bodyClassName="p-1 pt-3">
          {snapshotRows.length === 0 ? (
            <EmptyState
              icon={History}
              title={t('investments:detail.emptyTitle')}
              subtitle={t('investments:detail.emptySubtitle')}
            />
          ) : (
            <Table
              minWidth={420}
              head={[
                { label: t('common:column.date') },
                { label: t('investments:detail.column.price'), align: 'right', width: 120 },
                { label: t('investments:detail.column.change'), align: 'right', width: 120 },
              ]}
            >
              {snapshotRows.map((row) => (
                <tr key={row.id} className="h-13">
                  <Td muted>{row.dateLabel}</Td>
                  <Td align="right" mono strong>
                    <AmountValue value={row.priceLabel} hidden={hidden} />
                  </Td>
                  <Td align="right" mono>
                    <AmountValue value={row.changeLabel} hidden={hidden} tone={row.changeTone} />
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
              value={form.name}
              onChange={(event) => form.onNameChange(event.target.value)}
            />
            <Input
              label={t('investments:createDialog.tickerLabel')}
              value={form.ticker}
              onChange={(event) => form.onTickerChange(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('investments:createDialog.unitsLabel')}
              inputMode="decimal"
              value={form.qty}
              onChange={(event) => form.onQtyChange(event.target.value)}
            />
            <Input
              label={t('investments:createDialog.avgCostLabel')}
              inputMode="decimal"
              value={form.avg}
              onChange={(event) => form.onAvgChange(event.target.value)}
            />
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
            <Button tone="primary" size="sm" onClick={recordValueForm.onSubmit} disabled={!recordValueForm.canSubmit}>
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
