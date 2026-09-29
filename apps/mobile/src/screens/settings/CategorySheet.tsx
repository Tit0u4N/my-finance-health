import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { StyleSheet, Text } from 'react-native';
import { FONT_SIZE } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from '@/ui/Button';
import { ColorSwatchPicker } from '@/ui/ColorSwatchPicker';
import { Field } from '@/ui/Field';
import { Sheet } from '@/ui/Sheet';
import type { CategoryFormState } from './useCategoryForm';

type CategorySheetProps = {
  readonly form: CategoryFormState;
};

/** The New / Edit category sheet. Every handler and every derived string comes from
 * `useCategoryForm.ts`; this file only lays out the native controls. */
export function CategorySheet({ form }: CategorySheetProps) {
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
      <Text style={[styles.kind, { color: colors.muted }]}>{form.kindLabel}</Text>

      <Field
        label={t('settings:categories.dialog.nameLabel')}
        onChangeText={form.onNameChange}
        placeholder={t('settings:categories.dialog.namePlaceholder')}
        returnKeyType="done"
        value={form.name}
      />

      <Text style={[styles.label, { color: colors.muted }]}>{t('settings:categories.dialog.colourLabel')}</Text>
      <ColorSwatchPicker accessibilityLabel={form.colorAriaLabel} onChange={form.onColorChange} value={form.color} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: FONT_SIZE.bodySm },
  kind: { fontSize: FONT_SIZE.caption },
  label: { fontSize: FONT_SIZE.label, fontWeight: '500' },
});
