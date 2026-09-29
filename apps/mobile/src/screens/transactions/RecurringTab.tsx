import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { MoreVertical, Repeat } from 'lucide-react-native';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { AmountValue } from '@/ui/AmountValue';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { ConfirmSheet } from '@/ui/ConfirmSheet';
import { EmptyState } from '@/ui/EmptyState';
import { RoundButton } from '@/ui/RoundButton';
import { Switch } from '@/ui/Switch';
import { RowActionsSheet } from './RowActionsSheet';
import type { RecurringCardModel, RecurringTabModel } from './useRecurringTab';

type RecurringTabProps = {
  readonly recurring: RecurringTabModel;
};

/** The Activity tab's "Recurring" segment: one card per rule, sorted by next occurrence. */
export function RecurringTab({ recurring }: RecurringTabProps) {
  const { t } = useTranslation();

  return (
    <>
      <FlatList
        ListEmptyComponent={
          <EmptyState
            actionLabel={t('recurring:list.addRule')}
            icon={Repeat}
            onAction={recurring.onCreate}
            subtitle={t('recurring:list.emptySubtitle')}
            title={t('recurring:list.emptyTitle')}
          />
        }
        contentContainerStyle={styles.content}
        data={recurring.cards}
        keyExtractor={(card) => card.id}
        renderItem={({ item }) => (
          <RuleCard
            card={item}
            hidden={recurring.hidden}
            onOpenActions={() => recurring.onOpenRowActions(item.id)}
            onToggleActive={(active) => recurring.onToggleActive(item.id, active)}
          />
        )}
      />
      <RowActionsSheet
        actions={recurring.rowActions}
        closeLabel={t('common:action.close')}
        deleteLabel={t('common:action.delete')}
        editLabel={t('common:action.edit')}
      />
      <ConfirmSheet
        cancelLabel={t('common:action.cancel')}
        closeLabel={t('common:action.close')}
        confirmLabel={t('common:action.delete')}
        description={recurring.deleteSheet.description}
        isOpen={recurring.deleteSheet.isOpen}
        isSubmitting={recurring.deleteSheet.isSubmitting}
        onClose={recurring.deleteSheet.onClose}
        onConfirm={recurring.deleteSheet.onConfirm}
        title={recurring.deleteSheet.title}
      />
    </>
  );
}

type RuleCardProps = {
  readonly card: RecurringCardModel;
  readonly hidden: boolean;
  readonly onToggleActive: (active: boolean) => void;
  readonly onOpenActions: () => void;
};

function RuleCard({ card, hidden, onToggleActive, onOpenActions }: RuleCardProps) {
  const { colors } = useColor();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: card.isActive ? 1 : 0.6 },
      ]}
    >
      <View style={styles.cardTop}>
        {/* The category's own icon and colour, not the mock's generic `repeat` disc: the rule's
            category is the useful identity here, and rendering `Category.color` everywhere is
            docs/spec/cross-app-pitfalls.md #7. The recurrence is carried by the badges below. */}
        <Avatar color={card.categoryColor} icon={card.categoryIcon} soft />
        <View style={styles.cardText}>
          <Text numberOfLines={1} style={[styles.desc, { color: colors.foreground }]}>
            {card.desc}
          </Text>
          <Text numberOfLines={1} style={[styles.meta, { color: colors.muted }]}>
            {card.categoryName} · {card.accountName}
          </Text>
        </View>
        <Switch accessibilityLabel={card.activeAriaLabel} onValueChange={onToggleActive} value={card.isActive} />
        <RoundButton
          accessibilityLabel={card.actionsAriaLabel}
          icon={MoreVertical}
          onPress={onOpenActions}
          size={32}
          variant="ghost"
        />
      </View>
      <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
        <AmountValue
          hidden={hidden}
          style={styles.amount}
          tone={card.isPositive ? 'positive' : 'default'}
          value={card.amountLabel}
        />
        <View style={styles.badges}>
          <Badge color={colors.muted} size="sm">
            {card.freqLabel}
          </Badge>
          <Badge color={card.isActive ? colors.pos : colors.subtle} icon={Repeat} size="sm">
            {card.nextLabel}
          </Badge>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: FONT_SIZE.value, fontWeight: '600' },
  badges: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, justifyContent: 'flex-end' },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  cardBottom: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
  },
  cardText: { flex: 1, minWidth: 0 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm },
  content: { gap: SPACING.sm, padding: SPACING.gutter, paddingBottom: SPACING.section, paddingTop: 0 },
  desc: { fontSize: FONT_SIZE.body, fontWeight: '500' },
  meta: { fontSize: FONT_SIZE.caption, marginTop: 2 },
});
