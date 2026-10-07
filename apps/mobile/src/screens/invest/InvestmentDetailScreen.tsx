import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Pencil, Plus, Trash2, TrendingUp } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { AmountValue } from '@/ui/AmountValue';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ConfirmSheet } from '@/ui/ConfirmSheet';
import { LineChart } from '@/ui/charts/LineChart';
import { EmptyState } from '@/ui/EmptyState';
import { RoundButton } from '@/ui/RoundButton';
import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { InvestmentSheet } from './InvestmentSheet';
import { RecordValueSheet } from './RecordValueSheet';
import type { SnapshotRow } from './useInvestmentDetailScreen';
import { useInvestmentDetailScreen } from './useInvestmentDetailScreen';

type InvestmentDetailScreenProps = {
  readonly investmentId: string;
  readonly onBack: () => void;
};

/** Investment detail (screens-mobile.md "Invest → detail"): the position's identity, price and P/L,
 * a range-selectable price chart, and the value snapshots with a "Record" action. */
export function InvestmentDetailScreen({ investmentId, onBack }: InvestmentDetailScreenProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const screen = useInvestmentDetailScreen(investmentId, onBack);
  const chartWidth = width - SPACING.gutter * 2 - SPACING.gutter * 2;

  if (!screen.ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.muted }}>{t('common:state.loadingWorkspace')}</Text>
      </View>
    );
  }

  if (!screen.found) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <BackRow eyebrow="" onBack={screen.onBack} trailing={null} />
        <View style={styles.loading}>
          <Text style={{ color: colors.muted }}>{screen.notFoundLabel}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <BackRow
        eyebrow={screen.eyebrow}
        onBack={screen.onBack}
        trailing={<RoundButton accessibilityLabel={screen.editLabel} icon={Pencil} onPress={screen.onEdit} />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.identityRow}>
            <Avatar color={screen.color} icon={TrendingUp} size={44} />
            <View style={styles.identityText}>
              <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>
                {screen.title}
              </Text>
              <Text numberOfLines={1} style={[styles.subtitle, { color: colors.muted }]}>
                {screen.subtitle}
              </Text>
            </View>
          </View>
          <AmountValue hidden={screen.hidden} style={styles.price} value={screen.priceLabel} />
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
              value={`${screen.profitLossLabel} · ${screen.positionLabel}`}
            />
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{screen.priceHistoryTitle}</Text>
          <View style={styles.chart}>
            <LineChart color={screen.color} data={[...screen.trend]} height={150} width={chartWidth} />
          </View>
          <View style={styles.rangePicker}>
            <SegmentedTabs onChange={screen.onRangeChange} options={screen.rangeOptions} value={screen.range} />
          </View>
        </Card>

        <View style={styles.snapshotsHeader}>
          <Text style={[styles.sectionTitle, styles.snapshotsTitle, { color: colors.foreground }]}>
            {screen.snapshotsTitle}
          </Text>
          <Button icon={Plus} label={screen.recordLabel} onPress={screen.onRecordValue} tone="outline" />
        </View>

        {screen.snapshotRows.length === 0 ? (
          <EmptyState icon={TrendingUp} subtitle={screen.emptySubtitle} title={screen.emptyTitle} />
        ) : (
          <Card padding={0} style={styles.rowsCard}>
            {screen.snapshotRows.map((row, index) => (
              <Snapshot
                hidden={screen.hidden}
                isLast={index === screen.snapshotRows.length - 1}
                key={row.id}
                row={row}
              />
            ))}
          </Card>
        )}

        <Button icon={Trash2} label={screen.deleteLabel} onPress={screen.deleteDialog.onOpen} tone="outline" />
      </ScrollView>

      <InvestmentSheet form={screen.form} />
      <RecordValueSheet form={screen.recordValueForm} />
      <ConfirmSheet
        cancelLabel={t('common:action.cancel')}
        closeLabel={t('common:action.close')}
        confirmLabel={screen.deleteLabel}
        description={screen.deleteDialog.description}
        isOpen={screen.deleteDialog.isOpen}
        isSubmitting={screen.deleteDialog.isSubmitting}
        onClose={screen.deleteDialog.onClose}
        onConfirm={screen.deleteDialog.onConfirm}
        title={screen.deleteDialog.title}
      />
    </View>
  );
}

type BackRowProps = {
  readonly eyebrow: string;
  readonly onBack: () => void;
  readonly trailing: ReactNode;
};

function BackRow({ eyebrow, onBack, trailing }: BackRowProps) {
  const { colors } = useColor();
  const { t } = useTranslation();

  return (
    <View style={styles.backRow}>
      <RoundButton accessibilityLabel={t('common:action.back')} icon={ArrowLeft} onPress={onBack} variant="ghost" />
      <Text numberOfLines={1} style={[styles.eyebrow, { color: colors.muted }]}>
        {eyebrow}
      </Text>
      {trailing}
    </View>
  );
}

type SnapshotProps = {
  readonly row: SnapshotRow;
  readonly hidden: boolean;
  readonly isLast: boolean;
};

function Snapshot({ row, hidden, isLast }: SnapshotProps) {
  const { colors } = useColor();
  const changeTone = row.changeTone === 'positive' ? 'positive' : row.changeTone === 'negative' ? 'negative' : 'muted';

  return (
    <View
      style={[styles.row, !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowDate, { color: colors.foreground }]}>{row.dateLabel}</Text>
        <AmountValue hidden={hidden} style={styles.rowPrice} tone="muted" value={row.priceLabel} />
      </View>
      <AmountValue hidden={hidden} style={styles.rowChange} tone={changeTone} value={row.changeLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
  backRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.gutter,
    paddingBottom: SPACING.sm,
  },
  chart: { marginLeft: -SPACING.xs, marginTop: SPACING.sm },
  content: { gap: SPACING.md, padding: SPACING.gutter, paddingBottom: SPACING.section, paddingTop: 0 },
  deltaLabel: { flexShrink: 1, fontSize: 13 },
  deltaRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  eyebrow: { flex: 1, fontSize: 14 },
  identityRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm },
  identityText: { flex: 1, minWidth: 0 },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  price: { fontSize: 36, fontWeight: '600', letterSpacing: -1, marginTop: SPACING.md },
  rangePicker: { marginTop: SPACING.md },
  row: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md },
  rowChange: { fontSize: 12.5, fontWeight: '500' },
  rowDate: { fontSize: 13, fontWeight: '500' },
  rowPrice: { fontSize: 11.5, marginTop: 2 },
  rowText: { flex: 1, minWidth: 0 },
  rowsCard: { overflow: 'hidden' },
  screen: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  snapshotsHeader: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm },
  snapshotsTitle: { flex: 1 },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  title: { fontSize: 18, fontWeight: '600' },
});
