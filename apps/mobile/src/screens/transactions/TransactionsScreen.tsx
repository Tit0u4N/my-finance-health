import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { Plus } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { RoundButton } from '@/ui/RoundButton';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { LedgerTab } from './LedgerTab';
import { RecurringSheet } from './RecurringSheet';
import { RecurringTab } from './RecurringTab';
import { TransactionSheet } from './TransactionSheet';
import { useTransactionsScreen } from './useTransactionsScreen';

/** The Activity tab (docs/spec/screens-mobile.md "Activity"): a header whose `+` follows the visible
 * segment, the Transactions / Recurring segmented control, and the two create/edit sheets — which
 * live here rather than in either segment, because the header can open both. */
export function TransactionsScreen() {
  const { colors } = useColor();
  const { t } = useTranslation();
  const screen = useTransactionsScreen();

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
          trailing={
            <RoundButton accessibilityLabel={screen.addLabel} icon={Plus} onPress={screen.onAdd} variant="fill" />
          }
        />
        <SegmentedTabs
          accessibilityLabel={screen.title}
          onChange={screen.onTabChange}
          options={screen.tabOptions}
          value={screen.tab}
        />
      </View>

      {screen.tab === 'ledger' ? <LedgerTab ledger={screen.ledger} /> : <RecurringTab recurring={screen.recurring} />}

      <TransactionSheet form={screen.transactionForm} />
      <RecurringSheet form={screen.recurringForm} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: SPACING.md, padding: SPACING.gutter, paddingBottom: SPACING.sm },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  screen: { flex: 1 },
});
