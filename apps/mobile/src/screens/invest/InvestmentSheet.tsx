import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from '@/ui/Button';
import { ColorSwatchPicker } from '@/ui/ColorSwatchPicker';
import { Field } from '@/ui/Field';
import { Sheet } from '@/ui/Sheet';
import type { InvestmentFormState } from './useInvestmentForm';

type InvestmentSheetProps = {
  readonly form: InvestmentFormState;
};

/** The Add / Edit position sheet. Every handler and derived string comes from
 * `useInvestmentForm.ts`; this file only lays out the native controls. */
export function InvestmentSheet({ form }: InvestmentSheetProps) {
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
      <Field
        label={t('investments:createDialog.nameLabel')}
        onChangeText={form.onNameChange}
        placeholder={t('investments:createDialog.namePlaceholder')}
        value={form.name}
      />
      <Field
        label={t('investments:createDialog.tickerLabel')}
        onChangeText={form.onTickerChange}
        placeholder={t('investments:createDialog.tickerPlaceholder')}
        value={form.ticker}
      />
      <View style={styles.row}>
        <View style={styles.cell}>
          <Field
            keyboardType="decimal-pad"
            label={t('investments:createDialog.unitsLabel')}
            onChangeText={form.onQtyChange}
            placeholder="0"
            value={form.qty}
          />
        </View>
        <View style={styles.cell}>
          <Field
            keyboardType="decimal-pad"
            label={t('investments:createDialog.avgCostLabel')}
            onChangeText={form.onAvgChange}
            placeholder="0.00"
            value={form.avg}
          />
        </View>
      </View>
      {form.mode === 'create' && (
        <Field
          keyboardType="decimal-pad"
          label={t('investments:createDialog.currentPriceLabel')}
          onChangeText={form.onCurrentChange}
          placeholder="0.00"
          value={form.current}
        />
      )}
      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.muted }]}>{t('investments:createDialog.colourLabel')}</Text>
        <ColorSwatchPicker
          accessibilityLabel={t('investments:createDialog.colourAriaLabel')}
          onChange={form.onColorChange}
          value={form.color}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  block: { gap: SPACING.sm },
  cell: { flex: 1 },
  error: { fontSize: FONT_SIZE.bodySm },
  label: { fontSize: FONT_SIZE.label, fontWeight: '500' },
  row: { flexDirection: 'row', gap: SPACING.sm },
});
