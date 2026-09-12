// @repo/routes — level 3.
// View for the Account detail screen (screens.md) — JSX and @repo/ui composition only, all data
// and handlers come from useAccountDetailScreen.

import { AmountValue } from '@repo/ui/components/AmountValue';
import { Avatar } from '@repo/ui/components/Avatar';
import { Button } from '@repo/ui/components/Button';
import { ColorSwatchPicker } from '@repo/ui/components/ColorSwatchPicker';
import { Content } from '@repo/ui/components/Content';
import { LineChart } from '@repo/ui/components/charts/LineChart';
import { Dialog } from '@repo/ui/components/Dialog';
import { EmptyState } from '@repo/ui/components/EmptyState';
import { Input } from '@repo/ui/components/Input';
import { OptionGrid } from '@repo/ui/components/OptionGrid';
import { PageHeader } from '@repo/ui/components/PageHeader';
import { Panel } from '@repo/ui/components/Panel';
import { RangePicker } from '@repo/ui/components/RangePicker';
import { StatTile } from '@repo/ui/components/StatTile';
import { Table } from '@repo/ui/components/Table';
import { Td } from '@repo/ui/components/Td';
import { Download, Pencil, Receipt } from 'lucide-react';
import { useAccountDetailScreen } from './useAccountDetailScreen';

const KPI_ICON_COLOR: Record<string, string> = {
  inflow: 'var(--mfh-pos)',
  outflow: 'var(--mfh-neg)',
  net: 'var(--mfh-accent)',
};

export function AccountDetailScreen() {
  const screen = useAccountDetailScreen();

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
    rangeCaption,
    trend,
    trendColor,
    rows,
    rowCountLabel,
    edit,
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
            <Button tone="secondary" size="sm" icon={Pencil} onClick={edit.onOpen}>
              Edit
            </Button>
            <Button tone="secondary" size="sm" icon={Download} disabled>
              Export CSV
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
          title="Balance trend"
          subtitle={rangeCaption}
          right={
            <RangePicker value={range} onChange={onRangeChange} options={rangeOptions} ariaLabel="History range" />
          }
        >
          <LineChart data={trend} color={trendColor} />
        </Panel>

        <Panel
          title="Transactions"
          subtitle={rowCountLabel}
          bodyClassName="p-1 pt-3"
          right={
            <Button tone="secondary" size="sm" disabled>
              Filter
            </Button>
          }
        >
          {rows.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              subtitle="Activity on this account will show up here."
            />
          ) : (
            <Table
              minWidth={620}
              head={[
                { label: 'Description' },
                { label: 'Category', width: 170 },
                { label: 'Date', width: 120 },
                { label: 'Amount', align: 'right', width: 130 },
              ]}
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
                    <Td muted>{row.dateLabel}</Td>
                    <Td align="right" mono strong>
                      <AmountValue
                        value={row.amountLabel}
                        hidden={hidden}
                        tone={row.isPositive ? 'positive' : 'default'}
                      />
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Panel>
      </Content>

      <Dialog
        open={edit.isOpen}
        onOpenChange={edit.onClose}
        title="Edit account"
        width={560}
        actions={
          <>
            <Button tone="secondary" size="sm" onClick={edit.onClose}>
              Cancel
            </Button>
            <Button tone="primary" size="sm" onClick={edit.onSubmit} disabled={!edit.canSubmit}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Name" value={edit.name} onChange={(event) => edit.onNameChange(event.target.value)} />
          <div>
            <span className="text-label text-muted">Type</span>
            <div className="mt-2">
              <OptionGrid
                value={edit.type}
                onChange={edit.onTypeChange}
                options={edit.typeOptions}
                columns={2}
                ariaLabel="Account type"
              />
            </div>
          </div>
          <div>
            <span className="text-label text-muted">Colour</span>
            <div className="mt-2">
              <ColorSwatchPicker value={edit.color} onChange={edit.onColorChange} ariaLabel="Account colour" />
            </div>
          </div>
          {edit.errorMessage && <span className="text-body-sm text-neg">{edit.errorMessage}</span>}
        </div>
      </Dialog>
    </>
  );
}
