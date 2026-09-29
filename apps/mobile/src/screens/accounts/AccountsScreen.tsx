import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { Plus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { AmountValue } from '@/ui/AmountValue';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { AreaChart } from '@/ui/charts/AreaChart';
import { RoundButton } from '@/ui/RoundButton';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { AccountSheet } from './AccountSheet';
import type { AccountsCard } from './useAccountsScreen';
import { useAccountsScreen } from './useAccountsScreen';

const SPARKLINE_WIDTH = 320;

type AccountsScreenProps = {
  readonly onOpenAccount: (id: string) => void;
};

/** The Accounts tab (docs/spec/screens-mobile.md "Accounts"): a header `+` opening the New-account
 * sheet, one card per account with a balance sparkline and a past-month change, and a dashed
 * "Add another account" footer button. */
export function AccountsScreen({ onOpenAccount }: AccountsScreenProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const screen = useAccountsScreen();

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
        {screen.cards.map((card) => (
          <AccountCard card={card} hidden={screen.hidden} key={card.id} onPress={() => onOpenAccount(card.id)} />
        ))}

        <Button icon={Plus} label={screen.addAnotherLabel} onPress={screen.onAdd} tone="dashed" />
      </ScrollView>

      <AccountSheet form={screen.form} />
    </View>
  );
}

type AccountCardProps = {
  readonly card: AccountsCard;
  readonly hidden: boolean;
  readonly onPress: () => void;
};

function AccountCard({ card, hidden, onPress }: AccountCardProps) {
  const { colors } = useColor();

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card>
        <View style={styles.cardTop}>
          <View style={styles.cardIdentity}>
            <Avatar color={card.color} icon={card.icon} size={40} />
            <View style={styles.cardText}>
              <Text style={[styles.cardName, { color: colors.foreground }]}>{card.name}</Text>
              <Text style={[styles.cardMeta, { color: colors.muted }]}>{card.meta}</Text>
            </View>
          </View>
          <Badge
            color={
              card.changeTone === 'negative' ? colors.neg : card.changeTone === 'positive' ? colors.pos : colors.muted
            }
          >
            {card.changeLabel}
          </Badge>
        </View>

        <View style={styles.cardBalanceRow}>
          <AmountValue hidden={hidden} style={styles.cardBalance} value={card.balanceLabel} />
          <Text style={[styles.cardCurrency, { color: colors.muted }]}>{card.currencyLabel}</Text>
        </View>

        {card.sparkline.length > 1 && (
          <View style={styles.sparkline}>
            <AreaChart color={card.color} data={[...card.sparkline]} width={SPARKLINE_WIDTH} />
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardBalance: { fontSize: 26, fontWeight: '600', letterSpacing: -0.5 },
  cardBalanceRow: { alignItems: 'baseline', flexDirection: 'row', gap: 6, marginTop: SPACING.md },
  cardIdentity: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm },
  cardMeta: { fontSize: 12, marginTop: 2 },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardCurrency: { fontSize: 12, fontWeight: '500' },
  cardText: { minWidth: 0 },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  content: { gap: SPACING.md, padding: SPACING.gutter, paddingBottom: SPACING.section, paddingTop: 0 },
  header: { padding: SPACING.gutter, paddingBottom: SPACING.sm },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  screen: { flex: 1 },
  sparkline: { marginLeft: -SPACING.xs, marginTop: SPACING.sm },
});
