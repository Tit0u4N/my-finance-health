import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { MoreVertical, Search, X } from 'lucide-react-native';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { AmountValue } from '@/ui/AmountValue';
import { Avatar } from '@/ui/Avatar';
import { Chip } from '@/ui/Chip';
import { ChipSelect } from '@/ui/ChipSelect';
import { ConfirmSheet } from '@/ui/ConfirmSheet';
import { EmptyState } from '@/ui/EmptyState';
import { Field } from '@/ui/Field';
import { RoundButton } from '@/ui/RoundButton';
import { RowActionsSheet } from './RowActionsSheet';
import type { LedgerRow, LedgerTabModel } from './useLedgerTab';

type LedgerTabProps = {
  readonly ledger: LedgerTabModel;
};

/** The Activity tab's "Transactions" segment: search, filter chips, and the day-grouped list. */
export function LedgerTab({ ledger }: LedgerTabProps) {
  const { colors } = useColor();
  const { t } = useTranslation();

  return (
    <>
      <SectionList
        ListEmptyComponent={
          <EmptyState
            icon={Search}
            subtitle={t('transactions:list.emptySubtitle')}
            title={t('transactions:list.emptyTitle')}
            {...(ledger.isFiltered ? { actionLabel: t('transactions:list.reset'), onAction: ledger.onReset } : {})}
          />
        }
        ListHeaderComponent={<LedgerFilters ledger={ledger} />}
        contentContainerStyle={styles.content}
        keyExtractor={(row) => row.id}
        renderItem={({ item }) => (
          <Row hidden={ledger.hidden} onOpenActions={() => ledger.onOpenRowActions(item.id)} row={item} />
        )}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>{section.label}</Text>
            <AmountValue
              hidden={ledger.hidden}
              style={styles.sectionTotal}
              tone={section.isPositiveTotal ? 'positive' : 'muted'}
              value={section.totalLabel}
            />
          </View>
        )}
        sections={ledger.groups}
        stickySectionHeadersEnabled={false}
      />
      <RowActionsSheet
        actions={ledger.rowActions}
        closeLabel={t('common:action.close')}
        deleteLabel={t('common:action.delete')}
        editLabel={t('common:action.edit')}
      />
      <ConfirmSheet
        cancelLabel={t('common:action.cancel')}
        closeLabel={t('common:action.close')}
        confirmLabel={t('common:action.delete')}
        description={ledger.deleteSheet.description}
        isOpen={ledger.deleteSheet.isOpen}
        isSubmitting={ledger.deleteSheet.isSubmitting}
        onClose={ledger.deleteSheet.onClose}
        onConfirm={ledger.deleteSheet.onConfirm}
        title={ledger.deleteSheet.title}
      />
    </>
  );
}

function LedgerFilters({ ledger }: LedgerTabProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.filters}>
      <Field
        accessibilityLabel={t('transactions:list.searchPlaceholder')}
        icon={Search}
        onChangeText={ledger.onSearchChange}
        onClear={ledger.onClearSearch}
        placeholder={t('transactions:list.searchPlaceholder')}
        returnKeyType="search"
        value={ledger.searchValue}
      />
      {/* Wraps rather than scrolling horizontally: a horizontal scroll nested in the list's own
          vertical scroll is a gesture conflict, and four chips fit two rows at phone width. */}
      <View style={styles.chipRow}>
        <ChipSelect
          closeLabel={t('common:action.close')}
          label={t('transactions:list.typeAriaLabel')}
          onChange={ledger.onTypeChange}
          options={ledger.typeOptions}
          selected={ledger.isTypeFiltered}
          value={ledger.typeValue}
        />
        <ChipSelect
          closeLabel={t('common:action.close')}
          label={t('transactions:list.accountAriaLabel')}
          onChange={ledger.onAccountChange}
          options={ledger.accountOptions}
          selected={ledger.isAccountFiltered}
          value={ledger.accountValue}
        />
        <ChipSelect
          closeLabel={t('common:action.close')}
          label={t('transactions:list.categoryAriaLabel')}
          onChange={ledger.onCategoryChange}
          options={ledger.categoryOptions}
          selected={ledger.isCategoryFiltered}
          value={ledger.categoryValue}
        />
        {ledger.isFiltered && <Chip label={t('transactions:list.reset')} onPress={ledger.onReset} trailingIcon={X} />}
      </View>
    </View>
  );
}

type RowProps = {
  readonly row: LedgerRow;
  readonly hidden: boolean;
  readonly onOpenActions: () => void;
};

function Row({ row, hidden, onOpenActions }: RowProps) {
  const { colors } = useColor();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Avatar color={row.categoryColor} icon={row.categoryIcon} soft />
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={[styles.rowDesc, { color: colors.foreground }]}>
          {row.desc}
        </Text>
        <Text numberOfLines={1} style={[styles.rowMeta, { color: colors.muted }]}>
          {row.categoryName} · {row.accountName}
        </Text>
      </View>
      <AmountValue hidden={hidden} tone={row.isPositive ? 'positive' : 'default'} value={row.amountLabel} />
      <RoundButton
        accessibilityLabel={row.actionsAriaLabel}
        icon={MoreVertical}
        onPress={onOpenActions}
        size={32}
        variant="ghost"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  content: { gap: SPACING.xs, padding: SPACING.gutter, paddingBottom: SPACING.section, paddingTop: 0 },
  filters: { gap: SPACING.sm, paddingBottom: SPACING.sm },
  row: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  rowDesc: { fontSize: FONT_SIZE.body, fontWeight: '500' },
  rowMeta: { fontSize: FONT_SIZE.caption, marginTop: 2 },
  rowText: { flex: 1, minWidth: 0 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: SPACING.xs,
    paddingTop: SPACING.md,
  },
  sectionLabel: { fontSize: FONT_SIZE.caption, fontWeight: '600', textTransform: 'uppercase' },
  sectionTotal: { fontSize: FONT_SIZE.bodySm },
});
