// @repo/routes — level 3.
// View for the Account detail screen (screens.md) — JSX and @repo/ui composition only, all data
// and handlers come from useAccountDetailScreen. useTranslation is allowed here for static copy —
// everything derived (plurals, interpolation) stays in the ViewModel.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
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
  const { t } = useTranslation();
  const screen = useAccountDetailScreen();

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
              {t('accounts:detail.edit')}
            </Button>
            <Button tone="secondary" size="sm" icon={Download} disabled>
              {t('accounts:detail.exportCsv')}
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
          title={t('accounts:detail.balanceTrendTitle')}
          subtitle={rangeCaption}
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

        <Panel
          title={t('accounts:detail.transactionsPanelTitle')}
          subtitle={rowCountLabel}
          bodyClassName="p-1 pt-3"
          right={
            <Button tone="secondary" size="sm" disabled>
              {t('accounts:detail.filter')}
            </Button>
          }
        >
          {rows.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t('accounts:detail.emptyTitle')}
              subtitle={t('accounts:detail.emptySubtitle')}
            />
          ) : (
            <Table
              minWidth={620}
              head={[
                { label: t('common:column.description') },
                { label: t('common:column.category'), width: 170 },
                { label: t('common:column.date'), width: 120 },
                { label: t('common:column.amount'), align: 'right', width: 130 },
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
        title={t('accounts:editDialog.title')}
        closeLabel={t('common:action.close')}
        width={560}
        actions={
          <>
            <Button tone="secondary" size="sm" onClick={edit.onClose}>
              {t('common:action.cancel')}
            </Button>
            <Button tone="primary" size="sm" onClick={edit.onSubmit} disabled={!edit.canSubmit}>
              {t('common:action.saveChanges')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label={t('accounts:createDialog.nameLabel')}
            value={edit.name}
            onChange={(event) => edit.onNameChange(event.target.value)}
          />
          <div>
            <span className="text-label text-muted">{t('accounts:createDialog.typeLabel')}</span>
            <div className="mt-2">
              <OptionGrid
                value={edit.type}
                onChange={edit.onTypeChange}
                options={edit.typeOptions}
                columns={2}
                ariaLabel={t('accounts:createDialog.typeAriaLabel')}
              />
            </div>
          </div>
          <div>
            <span className="text-label text-muted">{t('accounts:editDialog.colourLabel')}</span>
            <div className="mt-2">
              <ColorSwatchPicker
                value={edit.color}
                onChange={edit.onColorChange}
                ariaLabel={t('accounts:editDialog.colourAriaLabel')}
              />
            </div>
          </div>
          {edit.errorMessage && <span className="text-body-sm text-neg">{edit.errorMessage}</span>}
        </div>
      </Dialog>
    </>
  );
}
