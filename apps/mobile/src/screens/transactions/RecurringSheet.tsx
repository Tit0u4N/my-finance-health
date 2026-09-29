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
import type { RecurringFormState } from './useRecurringForm';

type RecurringSheetProps = {
  readonly form: RecurringFormState;
};

/** The New / Edit recurring-rule sheet. `active` is deliberately absent — pausing a rule is the
 * list row's own `Switch`. */
export function RecurringSheet({ form }: RecurringSheetProps) {
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
        accessibilityLabel={t('recurring:dialog.typeAriaLabel')}
        onChange={form.onKindChange}
        options={form.kindOptions}
        value={form.kind}
      />

      <Field
        label={t('recurring:dialog.descLabel')}
        onChangeText={form.onDescChange}
        placeholder={t('recurring:dialog.descPlaceholder')}
        returnKeyType="done"
        value={form.desc}
      />

      <Field
        accessibilityLabel={t('recurring:dialog.amountLabel')}
        keyboardType="decimal-pad"
        label={t('recurring:dialog.amountLabel')}
        onChangeText={form.onAmountChange}
        placeholder="0.00"
        value={form.amount}
        variant="focal"
      />

      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.muted }]}>{t('recurring:dialog.freqLabel')}</Text>
        <View style={styles.chipWrap}>
          <ChipSelect
            closeLabel={t('common:action.close')}
            label={t('recurring:dialog.freqLabel')}
            onChange={form.onFreqChange}
            options={form.freqOptions}
            selected
            value={form.freq}
          />
        </View>
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.muted }]}>{t('recurring:dialog.accountLabel')}</Text>
        <View style={styles.chipWrap}>
          <ChipSelect
            closeLabel={t('common:action.close')}
            label={t('recurring:dialog.accountLabel')}
            onChange={form.onAccountChange}
            options={form.accountOptions}
            selected
            value={form.accountId}
          />
        </View>
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.muted }]}>{t('recurring:dialog.categoryLabel')}</Text>
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
        label={t('recurring:dialog.startDateLabel')}
        onChangeText={form.onStartDateChange}
        placeholder="YYYY-MM-DD"
        returnKeyType="done"
        value={form.startDate}
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
