import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { ChipSelect } from '@/ui/ChipSelect';
import { Field } from '@/ui/Field';
import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { Sheet } from '@/ui/Sheet';
import type { TransactionFormState } from './useTransactionForm';

type TransactionSheetProps = {
  readonly form: TransactionFormState;
};

/** The New / Edit transaction sheet. Every handler and every derived string comes from
 * `useTransactionForm.ts`; this file only lays out the native controls. */
export function TransactionSheet({ form }: TransactionSheetProps) {
  const { colors } = useColor();
  const { t } = useTranslation();

  return (
    <Sheet
      closeLabel={t('common:action.close')}
      footer={
        <>
          {form.errorMessage !== undefined && (
            <Text style={[styles.error, { color: colors.neg }]}>{form.errorMessage}</Text>
          )}
          <Button disabled={!form.canSubmit} label={form.submitLabel} onPress={form.onSubmit} />
        </>
      }
      isOpen={form.isOpen}
      onClose={form.onClose}
      title={form.title}
    >
      <SegmentedTabs
        accessibilityLabel={t('transactions:dialog.typeAriaLabel')}
        onChange={form.onKindChange}
        options={form.kindOptions}
        value={form.kind}
      />

      <Field
        accessibilityLabel={t('transactions:dialog.amountLabel')}
        keyboardType="decimal-pad"
        label={t('transactions:dialog.amountLabel')}
        onChangeText={form.onAmountChange}
        placeholder="0.00"
        value={form.amount}
        variant="focal"
      />

      <View style={styles.block}>
        <Field
          label={t('transactions:dialog.descLabel')}
          onChangeText={form.onDescChange}
          placeholder={t('transactions:dialog.descPlaceholder')}
          returnKeyType="done"
          value={form.desc}
        />
        {form.descSuggestions.length > 0 && (
          <View style={styles.chipWrap}>
            {form.descSuggestions.map((suggestion) => (
              <Chip key={suggestion} label={suggestion} onPress={() => form.onPickDescSuggestion(suggestion)} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.muted }]}>{t('transactions:dialog.accountLabel')}</Text>
        <View style={styles.chipWrap}>
          <ChipSelect
            closeLabel={t('common:action.close')}
            label={t('transactions:dialog.accountLabel')}
            onChange={form.onAccountChange}
            options={form.accountOptions}
            selected
            value={form.accountId}
          />
        </View>
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.muted }]}>{t('transactions:dialog.dateLabel')}</Text>
        <SegmentedTabs
          accessibilityLabel={t('transactions:dialog.dateLabel')}
          onChange={form.onDateModeChange}
          options={form.dateModeOptions}
          value={form.dateMode}
        />
        {form.dateMode === 'custom' && (
          <Field
            accessibilityLabel={t('transactions:dialog.dateLabel')}
            onChangeText={form.onDateChange}
            placeholder="YYYY-MM-DD"
            returnKeyType="done"
            value={form.date}
          />
        )}
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.muted }]}>{t('transactions:dialog.categoryLabel')}</Text>
        <View style={styles.chipWrap}>
          {form.categories.map((category) => (
            <Chip
              color={category.color}
              icon={category.icon}
              key={category.id}
              label={category.name}
              onPress={() => form.onCategoryChange(category.id)}
              selected={category.id === form.categoryId}
            />
          ))}
        </View>
      </View>

      <Field
        label={t('transactions:dialog.noteLabel')}
        onChangeText={form.onNoteChange}
        placeholder={t('transactions:dialog.notePlaceholder')}
        returnKeyType="done"
        value={form.note}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  block: { gap: SPACING.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  error: { fontSize: FONT_SIZE.bodySm },
  label: { fontSize: FONT_SIZE.label, fontWeight: '500' },
});
