import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { StyleSheet, Text } from 'react-native';
import { FONT_SIZE } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Sheet } from '@/ui/Sheet';
import type { RecordValueFormState } from './useRecordValueForm';

type RecordValueSheetProps = {
  readonly form: RecordValueFormState;
};

/** The "Record value" sheet — a date (typed `YYYY-MM-DD`) and a price per unit. */
export function RecordValueSheet({ form }: RecordValueSheetProps) {
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
        label={t('investments:recordValueDialog.dateLabel')}
        onChangeText={form.onDateChange}
        placeholder="YYYY-MM-DD"
        value={form.date}
      />
      <Field
        keyboardType="decimal-pad"
        label={t('investments:recordValueDialog.priceLabel')}
        onChangeText={form.onPriceChange}
        placeholder="0.00"
        value={form.price}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: FONT_SIZE.bodySm },
});
