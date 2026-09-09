// @repo/routes — level 3.
// View for the Overview screen (screens.md) — JSX and @repo/ui composition only, all data and
// handlers come from useOverviewScreen.

import { AccountFilter } from '@repo/ui/components/AccountFilter';
import { AmountValue } from '@repo/ui/components/AmountValue';
import { Avatar } from '@repo/ui/components/Avatar';
import { Badge } from '@repo/ui/components/Badge';
import { Content } from '@repo/ui/components/Content';
import { AreaChart } from '@repo/ui/components/charts/AreaChart';
import { Donut } from '@repo/ui/components/charts/Donut';
import { MiniBar } from '@repo/ui/components/charts/MiniBar';
import { Sankey } from '@repo/ui/components/charts/Sankey';
import { PageHeader } from '@repo/ui/components/PageHeader';
import { Panel } from '@repo/ui/components/Panel';
import { StatTile } from '@repo/ui/components/StatTile';
import { Table } from '@repo/ui/components/Table';
import { Td } from '@repo/ui/components/Td';
import { useOverviewScreen } from './useOverviewScreen';

export function OverviewScreen() {
  const overview = useOverviewScreen();

  if (!overview.ready) {
    return <div className="flex flex-1 items-center justify-center text-body text-muted">Loading your workspace…</div>;
  }

  const { hidden, kpis, cashflow, breakdown, accountRows, upcoming, activity, activityCountLabel, accountFilter } =
    overview;

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={overview.subtitle}
        actions={
          <AccountFilter
            accounts={accountFilter.accounts}
            selectedIds={accountFilter.selectedIds}
            onToggle={accountFilter.onToggle}
            onSelectAll={accountFilter.onSelectAll}
            hidden={hidden}
          />
        }
      />
      <Content>
        <div className="grid-kpi">
          {kpis.map((kpi) => (
            <StatTile
              key={kpi.id}
              label={kpi.label}
              hero={kpi.hero}
              value={<AmountValue value={kpi.valueLabel} hidden={hidden} tone={kpi.hero ? 'default' : 'default'} />}
              sub={kpi.sub}
              delta={
                kpi.deltaLabel ? (
                  <Badge tone={kpi.deltaTone === 'accent' ? 'accent' : (kpi.deltaTone ?? 'neutral')} size="sm">
                    {kpi.deltaLabel}
                  </Badge>
                ) : undefined
              }
              spark={
                kpi.sparkData && kpi.sparkData.length > 0 ? (
                  <MiniBar data={kpi.sparkData} color={kpi.sparkColor ?? 'var(--mfh-muted)'} />
                ) : undefined
              }
            />
          ))}
        </div>

        <div className="grid-2">
          <Panel title="Cashflow" subtitle="How this month moved through your money">
            <Sankey nodes={cashflow.nodes} links={cashflow.links} width={520} height={300} />
            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 border-border border-t pt-4">
              {cashflow.legend.map((entry) => (
                <div key={entry.id} className="flex min-w-0 items-center gap-1.5">
                  <span className="h-2 w-2 flex-shrink-0 rounded-sm" style={{ background: entry.color }} />
                  <span className="flex-1 truncate text-body-sm text-foreground">{entry.label}</span>
                  <AmountValue value={entry.valueLabel} hidden={hidden} tone="muted" className="text-body-sm" />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Spending breakdown" subtitle={`${breakdown.legend.length} categories this month`}>
            <div className="flex justify-center pb-1.5">
              <Donut
                data={breakdown.data}
                size={186}
                thickness={22}
                centerLabel="Spent"
                centerValue={hidden ? '••••' : breakdown.centerValueLabel}
              />
            </div>
            <div className="mt-2 flex flex-col gap-0.5">
              {breakdown.legend.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2.5 border-border border-t py-1.5">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: entry.color }} />
                  <span className="flex-1 truncate text-body-sm text-foreground">{entry.name}</span>
                  <AmountValue value={entry.valueLabel} hidden={hidden} tone="muted" className="text-body-sm" />
                  <span className="w-9 text-right text-caption text-subtle normal-case tabular-nums">
                    {entry.percentLabel}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid-2">
          <Panel title="Accounts" subtitle={`${accountRows.length} in scope`} bodyClassName="p-0 pt-1.5">
            {accountRows.map((account, index) => (
              <div
                key={account.id}
                className={`flex items-center gap-3 px-4.5 py-3 ${index < accountRows.length - 1 ? 'border-border border-b' : ''}`}
              >
                <Avatar icon={account.icon} color={account.color} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-foreground text-label-strong">{account.name}</div>
                  <div className="mt-0.5 text-caption text-muted normal-case">{account.typeLabel}</div>
                </div>
                <div className="w-23 flex-shrink-0">
                  {account.sparkline.length > 1 && (
                    <AreaChart data={account.sparkline} width={92} height={30} color={account.color} />
                  )}
                </div>
                <AmountValue
                  value={account.balanceLabel}
                  hidden={hidden}
                  className="w-24 flex-shrink-0 text-right text-label-strong"
                />
              </div>
            ))}
            {upcoming.length > 0 && (
              <div className="border-border border-t px-4.5 py-3.5">
                <div className="mb-2.5 text-caption text-subtle">Upcoming</div>
                <div className="flex flex-col gap-2">
                  {upcoming.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2">
                      <span className="flex-1 truncate text-body-sm text-foreground">{rule.desc}</span>
                      <span className="text-caption text-subtle normal-case">{rule.whenLabel}</span>
                      <AmountValue
                        value={rule.amountLabel}
                        hidden={hidden}
                        tone={rule.isPositive ? 'positive' : 'default'}
                        className="w-20 flex-shrink-0 text-right text-body-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Recent activity" subtitle={activityCountLabel} bodyClassName="p-1 pt-3">
            <Table
              minWidth={560}
              head={[
                { label: 'Description' },
                { label: 'Category', width: 150 },
                { label: 'Account', width: 110 },
                { label: 'Date', width: 90 },
                { label: 'Amount', align: 'right', width: 116 },
              ]}
            >
              {activity.map((row) => {
                const CategoryIcon = row.categoryIcon;
                return (
                  <tr key={row.id} className="h-13">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar icon={CategoryIcon} color={row.categoryColor} soft size={28} />
                        <span className="font-medium">{row.desc}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 rounded-sm bg-chip-bg px-2 py-0.5 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: row.categoryColor }} />
                        {row.categoryName}
                      </span>
                    </Td>
                    <Td muted>{row.accountName}</Td>
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
          </Panel>
        </div>
      </Content>
    </>
  );
}
