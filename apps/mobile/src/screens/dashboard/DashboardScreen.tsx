import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { ArrowDownRight, ArrowUpRight, Eye, EyeOff, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ACCENT, BORDER_RADIUS, FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { AmountValue } from '@/ui/AmountValue';
import { Avatar } from '@/ui/Avatar';
import { Card } from '@/ui/Card';
import { Donut } from '@/ui/charts/Donut';
import { MiniBar } from '@/ui/charts/MiniBar';
import { Sankey } from '@/ui/charts/Sankey';
import { RoundButton } from '@/ui/RoundButton';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { TransactionSheet } from '../transactions/TransactionSheet';
import { useDashboardScreen } from './useDashboardScreen';

export function DashboardScreen() {
  const { colors } = useColor();
  const { t } = useTranslation();
  const dashboard = useDashboardScreen();

  if (!dashboard.ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.muted }}>{t('common:state.loadingWorkspace')}</Text>
      </View>
    );
  }

  const { hidden, onToggleHidden, kpis, cashflow, breakdown, activity } = dashboard;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          subtitle={dashboard.subtitle}
          title={t('common:nav.home')}
          trailing={<RoundButton accessibilityLabel={dashboard.addLabel} icon={Plus} onPress={dashboard.onAdd} />}
        />

        <View style={[styles.hero, { backgroundColor: ACCENT }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>{t('overview:kpi.balance')}</Text>
              <Text style={styles.heroSub}>{dashboard.balanceSubLabel}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onToggleHidden} style={styles.heroEyeButton}>
              {hidden ? <Eye color="#FFFFFF" size={16} /> : <EyeOff color="#FFFFFF" size={16} />}
            </Pressable>
          </View>
          <AmountValue hidden={hidden} style={styles.heroValue} tone="onAccent" value={dashboard.totalBalanceLabel} />
          <View style={styles.heroDelta}>
            <View style={styles.heroPill}>
              {dashboard.netRateIsPositive ? (
                <ArrowDownRight color="#FFFFFF" size={11} />
              ) : (
                <ArrowUpRight color="#FFFFFF" size={11} />
              )}
              <Text style={styles.heroPillLabel}>{dashboard.netRateLabel}</Text>
            </View>
            <Text style={styles.heroDeltaSub}>{t('overview:kpi.thisMonth')}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          {kpis.map((kpi) => (
            <Card key={kpi.id} padding={SPACING.md} style={styles.kpiCard}>
              <Avatar
                color={kpi.sparkColor === 'pos' ? colors.pos : colors.neg}
                icon={kpi.sparkColor === 'pos' ? ArrowDownRight : ArrowUpRight}
                size={28}
                soft
              />
              <AmountValue style={styles.kpiValue} value={kpi.valueLabel} />
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>{kpi.label}</Text>
              {kpi.sparkData.length > 0 && (
                <View style={styles.kpiSpark}>
                  <MiniBar
                    color={kpi.sparkColor === 'pos' ? colors.pos : colors.neg}
                    data={kpi.sparkData}
                    height={24}
                    width={140}
                  />
                </View>
              )}
            </Card>
          ))}
        </View>

        <Card>
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>{t('overview:cashflow.panelTitle')}</Text>
          <Text style={[styles.panelSubtitle, { color: colors.muted }]}>{t('overview:cashflow.panelSubtitle')}</Text>
          <View style={styles.sankeyWrap}>
            <Sankey height={220} links={cashflow.links} nodes={cashflow.nodes} width={310} />
          </View>
          <View style={[styles.legendGrid, { borderTopColor: colors.border }]}>
            {cashflow.legend.map((entry) => (
              <View key={entry.id} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: entry.color }]} />
                <Text numberOfLines={1} style={[styles.legendLabel, { color: colors.foreground }]}>
                  {entry.label}
                </Text>
                <AmountValue style={styles.legendValue} tone="muted" value={entry.valueLabel} />
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>{t('overview:breakdown.panelTitle')}</Text>
          <View style={styles.donutWrap}>
            <Donut
              centerLabel={t('overview:breakdown.centerLabel')}
              centerValue={hidden ? '••••' : breakdown.centerValueLabel}
              data={breakdown.data}
              size={140}
              thickness={18}
            />
          </View>
          <View style={styles.legendList}>
            {breakdown.legend.map((entry) => (
              <View key={entry.id} style={[styles.legendRow, { borderTopColor: colors.border }]}>
                <View style={[styles.legendDotRound, { backgroundColor: entry.color }]} />
                <Text numberOfLines={1} style={[styles.legendLabel, { color: colors.foreground }]}>
                  {entry.name}
                </Text>
                <Text style={[styles.legendPercent, { color: colors.subtle }]}>{entry.percentLabel}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card padding={0} style={styles.activityCard}>
          <Text style={[styles.panelTitle, styles.activityTitle, { color: colors.foreground }]}>
            {t('overview:activity.panelTitle')}
          </Text>
          {activity.map((row, index) => (
            <View
              key={row.id}
              style={[
                styles.activityRow,
                index < activity.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Avatar color={row.categoryColor} icon={row.categoryIcon} soft />
              <View style={styles.activityText}>
                <Text numberOfLines={1} style={[styles.activityDesc, { color: colors.foreground }]}>
                  {row.desc}
                </Text>
                <Text style={[styles.activityMeta, { color: colors.muted }]}>
                  {row.categoryName} · {row.dateLabel}
                </Text>
              </View>
              <AmountValue hidden={hidden} tone={row.isPositive ? 'positive' : 'default'} value={row.amountLabel} />
            </View>
          ))}
        </Card>
      </ScrollView>
      <TransactionSheet form={dashboard.transactionForm} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  activityCard: { overflow: 'hidden' },
  activityDesc: { flexShrink: 1, fontSize: FONT_SIZE.body, fontWeight: '500' },
  activityMeta: { fontSize: FONT_SIZE.caption, marginTop: 2 },
  activityRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md },
  activityText: { flex: 1, minWidth: 0 },
  activityTitle: { padding: SPACING.md, paddingBottom: 0 },
  content: { gap: SPACING.md, padding: SPACING.gutter, paddingBottom: SPACING.section },
  donutWrap: { alignItems: 'center', paddingBottom: SPACING.sm },
  hero: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.gutter },
  heroDelta: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  heroDeltaSub: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.bodySm },
  heroEyeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: BORDER_RADIUS.full,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZE.caption,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  heroPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  heroPillLabel: { color: '#FFFFFF', fontSize: FONT_SIZE.label, fontWeight: '500' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.bodySm, marginTop: 4 },
  heroTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  heroValue: { color: '#FFFFFF', fontSize: FONT_SIZE.valueHero, fontWeight: '600', marginTop: SPACING.md },
  kpiCard: { flex: 1, gap: SPACING.sm },
  kpiLabel: { fontSize: FONT_SIZE.caption },
  kpiRow: { flexDirection: 'row', gap: SPACING.sm },
  kpiSpark: { marginTop: 2 },
  kpiValue: { fontSize: FONT_SIZE.value, fontWeight: '600' },
  legendDot: { borderRadius: 2, height: 8, width: 8 },
  legendDotRound: { borderRadius: 99, height: 8, width: 8 },
  legendGrid: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  legendLabel: { flex: 1, fontSize: FONT_SIZE.bodySm },
  legendList: { gap: 0 },
  legendPercent: { fontSize: FONT_SIZE.caption },
  legendRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, minWidth: '45%', paddingVertical: 6 },
  legendValue: { fontSize: FONT_SIZE.bodySm },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  panelSubtitle: { fontSize: FONT_SIZE.caption, marginTop: 2 },
  panelTitle: { fontSize: FONT_SIZE.headingSm, fontWeight: '600' },
  sankeyWrap: { alignItems: 'center', marginTop: SPACING.sm },
});
