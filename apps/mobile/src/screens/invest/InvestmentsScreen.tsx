import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { ArrowDownRight, ArrowUpRight, Plus, TrendingUp } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { AmountValue } from '@/ui/AmountValue';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { LineChart } from '@/ui/charts/LineChart';
import { EmptyState } from '@/ui/EmptyState';
import { RoundButton } from '@/ui/RoundButton';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { InvestmentSheet } from './InvestmentSheet';
import type { AllocationRow, InvestmentsRow } from './useInvestmentsScreen';
import { useInvestmentsScreen } from './useInvestmentsScreen';

type InvestmentsScreenProps = {
  readonly onOpenInvestment: (id: string) => void;
};

/** The Invest tab (docs/spec/screens-mobile.md "Invest"): a portfolio hero card with its trend, an
 * allocation card of per-position bars, and the positions list. */
export function InvestmentsScreen({ onOpenInvestment }: InvestmentsScreenProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const screen = useInvestmentsScreen();
  const chartWidth = width - SPACING.gutter * 2 - SPACING.gutter * 2;

  if (!screen.ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.muted }}>{t('common:state.loadingWorkspace')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ScreenHeader
          subtitle={screen.subtitle}
          title={screen.title}
          trailing={<RoundButton accessibilityLabel={screen.addLabel} icon={Plus} onPress={screen.onAdd} />}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {screen.isEmpty ? (
          <EmptyState icon={TrendingUp} subtitle={screen.emptySubtitle} title={screen.emptyTitle} />
        ) : (
          <>
            <Card style={{ backgroundColor: colors.surfaceAlt }}>
              <Text style={[styles.eyebrow, { color: colors.muted }]}>{screen.valueTitle}</Text>
              <AmountValue hidden={screen.hidden} style={styles.hero} value={screen.valueLabel} />
              <View style={styles.deltaRow}>
                <Badge
                  color={screen.isProfitPositive ? colors.pos : colors.neg}
                  icon={screen.isProfitPositive ? ArrowUpRight : ArrowDownRight}
                >
                  {screen.profitLossPercentLabel}
                </Badge>
                <AmountValue
                  hidden={screen.hidden}
                  style={styles.deltaLabel}
                  tone="muted"
                  value={screen.profitLossLabel}
                />
              </View>
              <View style={styles.chart}>
                <LineChart color={colors.foreground} data={[...screen.trend]} height={120} width={chartWidth} />
              </View>
            </Card>

            <Card>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{screen.allocationTitle}</Text>
              <View style={styles.allocationList}>
                {screen.allocation.map((row) => (
                  <AllocationBar hidden={screen.hidden} key={row.id} row={row} />
                ))}
              </View>
            </Card>

            <View>
              <Text style={[styles.sectionTitle, styles.positionsTitle, { color: colors.foreground }]}>
                {screen.positionsTitle}
              </Text>
              <Card padding={0} style={styles.rowsCard}>
                {screen.rows.map((row, index) => (
                  <PositionRow
                    hidden={screen.hidden}
                    isLast={index === screen.rows.length - 1}
                    key={row.id}
                    onPress={() => onOpenInvestment(row.id)}
                    row={row}
                  />
                ))}
              </Card>
            </View>
          </>
        )}
      </ScrollView>

      <InvestmentSheet form={screen.form} />
    </View>
  );
}

type AllocationBarProps = {
  readonly row: AllocationRow;
  readonly hidden: boolean;
};

function AllocationBar({ row, hidden }: AllocationBarProps) {
  const { colors } = useColor();

  return (
    <View>
      <View style={styles.allocationHead}>
        <View style={styles.allocationName}>
          <View style={[styles.dot, { backgroundColor: row.color }]} />
          <Text numberOfLines={1} style={[styles.positionName, { color: colors.foreground }]}>
            {row.name}
          </Text>
        </View>
        <AmountValue hidden={hidden} style={styles.allocationLabel} tone="muted" value={row.label} />
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <View style={{ backgroundColor: row.color, borderRadius: 99, height: '100%', width: `${row.share * 100}%` }} />
      </View>
    </View>
  );
}

type PositionRowProps = {
  readonly row: InvestmentsRow;
  readonly hidden: boolean;
  readonly isLast: boolean;
  readonly onPress: () => void;
};

function PositionRow({ row, hidden, isLast, onPress }: PositionRowProps) {
  const { colors } = useColor();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
    >
      <Avatar color={row.color} icon={TrendingUp} />
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={[styles.positionName, { color: colors.foreground }]}>
          {row.name}
        </Text>
        <Text numberOfLines={1} style={[styles.rowMeta, { color: colors.muted }]}>
          {row.meta}
        </Text>
      </View>
      <View style={styles.rowAmounts}>
        <AmountValue hidden={hidden} style={styles.rowValue} value={row.valueLabel} />
        <Text style={[styles.rowPercent, { color: row.isPositive ? colors.pos : colors.neg }]}>{row.percentLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  allocationHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  allocationLabel: { fontSize: 12.5, fontWeight: '500' },
  allocationList: { gap: SPACING.md, marginTop: SPACING.md },
  allocationName: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: SPACING.sm },
  chart: { marginLeft: -SPACING.xs, marginTop: SPACING.md },
  content: { gap: SPACING.md, padding: SPACING.gutter, paddingBottom: SPACING.section, paddingTop: 0 },
  deltaLabel: { fontSize: 13 },
  deltaRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  dot: { borderRadius: 99, height: 8, width: 8 },
  eyebrow: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase' },
  header: { padding: SPACING.gutter, paddingBottom: SPACING.sm },
  hero: { fontSize: 38, fontWeight: '600', letterSpacing: -1.2, marginTop: 6 },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  positionName: { fontSize: 14, fontWeight: '500' },
  positionsTitle: { paddingBottom: SPACING.sm, paddingHorizontal: SPACING.xs },
  row: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md },
  rowAmounts: { alignItems: 'flex-end', flexShrink: 0 },
  rowMeta: { fontSize: 11, marginTop: 2 },
  rowPercent: { fontSize: 11.5, fontVariant: ['tabular-nums'], fontWeight: '500', marginTop: 2 },
  rowText: { flex: 1, minWidth: 0 },
  rowValue: { fontSize: 14, fontWeight: '600' },
  rowsCard: { overflow: 'hidden' },
  screen: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  track: { borderRadius: 99, height: 5, overflow: 'hidden', width: '100%' },
});
