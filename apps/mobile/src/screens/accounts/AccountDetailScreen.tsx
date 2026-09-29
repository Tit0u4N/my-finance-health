import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { ArrowLeft, Pencil, Search } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { AmountValue } from '@/ui/AmountValue';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { ChipSelect } from '@/ui/ChipSelect';
import { LineChart } from '@/ui/charts/LineChart';
import { EmptyState } from '@/ui/EmptyState';
import { Field } from '@/ui/Field';
import { RoundButton } from '@/ui/RoundButton';
import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { AccountSheet } from './AccountSheet';
import type { AccountDetailRow } from './useAccountDetailScreen';
import { useAccountDetailScreen } from './useAccountDetailScreen';

type AccountDetailScreenProps = {
  readonly accountId: string;
  readonly onBack: () => void;
};

/** Account detail (screens.md "Account detail"): the account's identity and balance, a
 * range-selectable trend chart, and its transaction list with a search + category filter. */
export function AccountDetailScreen({ accountId, onBack }: AccountDetailScreenProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const screen = useAccountDetailScreen(accountId, onBack);
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
        trailing={
          <RoundButton accessibilityLabel={screen.overflowAriaLabel} icon={Pencil} onPress={screen.onOpenEdit} />
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.identityRow}>
            <Avatar color={screen.color} icon={screen.icon} size={44} />
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>{screen.title}</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>{screen.subtitle}</Text>
            </View>
          </View>
          <AmountValue hidden={screen.hidden} style={styles.balance} value={screen.balanceLabel} />
          <View style={styles.badgeRow}>
            <Badge color={colors.pos}>{screen.currencyLabel}</Badge>
            <Badge color={colors.muted}>{screen.rowCountBadge}</Badge>
          </View>
        </Card>

        <Card>
          <View style={styles.trendHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('accounts:detail.balanceTrendTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{screen.rangeCaption}</Text>
          </View>
          <LineChart color={screen.trendColor} data={[...screen.trend]} width={chartWidth} />
          <View style={styles.rangePicker}>
            <SegmentedTabs onChange={screen.onRangeChange} options={screen.rangeOptions} value={screen.range} />
          </View>
        </Card>

        <View style={styles.filters}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{screen.transactionsTitle}</Text>
          <Field
            icon={Search}
            onChangeText={screen.onSearchChange}
            onClear={screen.onClearSearch}
            placeholder={screen.searchPlaceholder}
            returnKeyType="search"
            value={screen.searchValue}
          />
          <ChipSelect
            closeLabel={t('common:action.close')}
            label={t('transactions:list.categoryAriaLabel')}
            onChange={screen.onCategoryChange}
            options={screen.categoryOptions}
            selected={screen.isFiltered}
            value={screen.categoryValue}
          />
        </View>

        {screen.rows.length === 0 ? (
          <EmptyState icon={Search} subtitle={screen.emptySubtitle} title={screen.emptyTitle} />
        ) : (
          <Card padding={0} style={styles.rowsCard}>
            {screen.rows.map((row, index) => (
              <Row hidden={screen.hidden} isLast={index === screen.rows.length - 1} key={row.id} row={row} />
            ))}
          </Card>
        )}
      </ScrollView>

      <AccountSheet form={screen.editForm} />
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

type RowProps = {
  readonly row: AccountDetailRow;
  readonly hidden: boolean;
  readonly isLast: boolean;
};

function Row({ row, hidden, isLast }: RowProps) {
  const { colors } = useColor();

  return (
    <View
      style={[styles.row, !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
    >
      <Avatar color={row.categoryColor} icon={row.categoryIcon} soft />
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={[styles.rowDesc, { color: colors.foreground }]}>
          {row.desc}
        </Text>
        <Text numberOfLines={1} style={[styles.rowMeta, { color: colors.muted }]}>
          {row.categoryName} · {row.dateLabel}
        </Text>
      </View>
      <AmountValue hidden={hidden} tone={row.isPositive ? 'positive' : 'default'} value={row.amountLabel} />
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
  badgeRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm },
  balance: { fontSize: 34, fontWeight: '600', letterSpacing: -0.8, marginTop: SPACING.md },
  content: { gap: SPACING.md, padding: SPACING.gutter, paddingBottom: SPACING.section, paddingTop: 0 },
  eyebrow: { flex: 1, fontSize: 14 },
  filters: { gap: SPACING.sm },
  identityRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  rangePicker: { marginTop: SPACING.md },
  row: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md },
  rowDesc: { fontSize: 14, fontWeight: '500' },
  rowMeta: { fontSize: 12, marginTop: 2 },
  rowText: { flex: 1, minWidth: 0 },
  rowsCard: { overflow: 'hidden' },
  screen: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  title: { fontSize: 18, fontWeight: '600' },
  trendHeader: { marginBottom: SPACING.sm },
});
