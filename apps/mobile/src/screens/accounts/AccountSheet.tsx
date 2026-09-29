import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from '@/ui/Button';
import { ChipSelect } from '@/ui/ChipSelect';
import { Field } from '@/ui/Field';
import { OptionGrid } from '@/ui/OptionGrid';
import { Sheet } from '@/ui/Sheet';
import type { AccountFormState } from './useAccountForm';

type AccountSheetProps = {
  readonly form: AccountFormState;
};

/** The New / Edit account sheet. Every handler and every derived string comes from
 * `useAccountForm.ts`; this file only lays out the native controls. */
export function AccountSheet({ form }: AccountSheetProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const isCreate = form.mode === 'create';

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
        label={t('accounts:createDialog.nameLabel')}
        onChangeText={form.onNameChange}
        placeholder={t('accounts:createDialog.namePlaceholder')}
        returnKeyType="done"
        value={form.name}
      />

      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.muted }]}>{t('accounts:createDialog.typeLabel')}</Text>
        <OptionGrid
          accessibilityLabel={form.typeAriaLabel}
          columns={2}
          onChange={form.onTypeChange}
          options={form.typeOptions}
          value={form.type}
        />
      </View>

      {isCreate && (
        <View style={styles.row}>
          <View style={styles.balanceField}>
            <Field
              keyboardType="decimal-pad"
              label={t('accounts:createDialog.initialBalanceLabel')}
              onChangeText={form.onInitialBalanceChange}
              placeholder="0.00"
              value={form.initialBalance}
            />
          </View>
          <ChipSelect
            closeLabel={t('common:action.close')}
            label={t('accounts:createDialog.currencyLabel')}
            onChange={(value) => form.onCurrencyChange(value as CurrencyCode)}
            options={form.currencyOptions}
            selected
            value={form.currency}
          />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  balanceField: { flex: 1 },
  block: { gap: SPACING.sm },
  error: { fontSize: FONT_SIZE.bodySm },
  label: { fontSize: FONT_SIZE.label, fontWeight: '500' },
  row: { alignItems: 'flex-end', flexDirection: 'row', gap: SPACING.sm },
});
