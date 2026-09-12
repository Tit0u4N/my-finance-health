// @repo/routes — level 3.
// View for the Investment detail screen (screens.md) — JSX and @repo/ui composition only, all
// data and handlers come from useInvestmentDetailScreen.

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
  const screen = useInvestmentDetailScreen();

  if (!screen.ready) {
    return <div className="flex flex-1 items-center justify-center text-body text-muted">Loading your workspace…</div>;
  }

  if (!screen.found) {
    return <PageHeader title="Not found" back={screen.onBack} />;
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
              Edit
            </Button>
            <Button tone="secondary" size="sm" icon={CirclePlus} onClick={onRecordValue}>
              Record value
            </Button>
            <Button tone="destruct" size="sm" icon={Trash2} onClick={deleteDialog.onOpen}>
              Delete position
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
              value={<AmountValue value={kpi.valueLabel} hidden={hidden} />}
              sub={kpi.sub}
            />
          ))}
        </div>

        <Panel
          title="Price history"
          right={
            <RangePicker value={range} onChange={onRangeChange} options={rangeOptions} ariaLabel="History range" />
          }
        >
          <LineChart data={trend} color={trendColor} />
        </Panel>

        <Panel title="Notes">
          <div className="flex flex-col gap-3">
            <Textarea
              label="Notes"
              placeholder="Add a note about this position…"
              value={note.value}
              onChange={(event) => note.onChange(event.target.value)}
            />
            <div className="flex justify-end">
              <Button tone="secondary" size="sm" onClick={note.onSave} disabled={note.isSubmitting}>
                Save note
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="Snapshots" subtitle={snapshotCountLabel} bodyClassName="p-1 pt-3">
          {snapshotRows.length === 0 ? (
            <EmptyState
              icon={History}
              title="No recorded values yet"
              subtitle="Record a value to start tracking this position's price history."
            />
          ) : (
            <Table
              minWidth={420}
              head={[
                { label: 'Date' },
                { label: 'Price', align: 'right', width: 120 },
                { label: 'Change', align: 'right', width: 120 },
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
        title="Edit position"
        width={520}
        actions={
          <>
            <Button tone="secondary" size="sm" onClick={form.onClose}>
              Cancel
            </Button>
            <Button tone="primary" size="sm" onClick={form.onSubmit} disabled={!form.canSubmit}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={form.name} onChange={(event) => form.onNameChange(event.target.value)} />
            <Input label="Ticker" value={form.ticker} onChange={(event) => form.onTickerChange(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Units"
              inputMode="decimal"
              value={form.qty}
              onChange={(event) => form.onQtyChange(event.target.value)}
            />
            <Input
              label="Avg cost"
              inputMode="decimal"
              value={form.avg}
              onChange={(event) => form.onAvgChange(event.target.value)}
            />
          </div>
          <div>
            <span className="text-label text-muted">Colour</span>
            <div className="mt-2">
              <ColorSwatchPicker value={form.color} onChange={form.onColorChange} ariaLabel="Position colour" />
            </div>
          </div>
          {form.errorMessage && <span className="text-body-sm text-neg">{form.errorMessage}</span>}
        </div>
      </Dialog>

      <Dialog
        open={recordValueForm.isOpen}
        onOpenChange={recordValueForm.onClose}
        title={`Record value — ${recordValueForm.investmentName}`}
        width={420}
        actions={
          <>
            <Button tone="secondary" size="sm" onClick={recordValueForm.onClose}>
              Cancel
            </Button>
            <Button tone="primary" size="sm" onClick={recordValueForm.onSubmit} disabled={!recordValueForm.canSubmit}>
              Save value
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Date"
            type="date"
            value={recordValueForm.date}
            onChange={(event) => recordValueForm.onDateChange(event.target.value)}
          />
          <Input
            label="Price per unit"
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
        title={`Delete "${screen.title}"?`}
        description="This position and its entire value history will be permanently removed."
        confirmLabel="Delete"
        onConfirm={deleteDialog.onConfirm}
        isPending={deleteDialog.isSubmitting}
      />
    </>
  );
}
