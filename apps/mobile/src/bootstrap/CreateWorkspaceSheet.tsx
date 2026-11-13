import { MIN_PASSPHRASE_LENGTH } from '@repo/app-core/bootstrap/newPassphrase';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import type { CreateWorkspaceInput } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { Platform } from '@repo/platform/platform';
import { Cloud, FolderOpen, Smartphone } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { OptionGrid, type OptionGridItem } from '@/ui/OptionGrid';
import { Sheet } from '@/ui/Sheet';
import { Switch } from '@/ui/Switch';
import { useCreateWorkspaceForm, type WorkspaceLocation } from './useCreateWorkspaceForm';

const CURRENCY_OPTIONS: readonly OptionGridItem<CurrencyCode>[] = [
  { glyph: '€', label: 'EUR', value: 'EUR' },
  { glyph: '$', label: 'USD', value: 'USD' },
  { glyph: '£', label: 'GBP', value: 'GBP' },
];

type CreateWorkspaceSheetProps = {
  readonly isOpen: boolean;
  readonly platform: Platform;
  readonly onClose: () => void;
  readonly onCreate: (
    ref: WorkspaceRef,
    input: CreateWorkspaceInput,
    backupFolder: string | null,
    remember: boolean,
  ) => void;
};

/** New encrypted workspace, on this device or in iCloud Drive when available. The passphrase is the only key: nothing can
 * recover the data without it (start-roadmap.md §9 — "never a silent device-keyring unlock"). */
export function CreateWorkspaceSheet({ isOpen, platform, onClose, onCreate }: CreateWorkspaceSheetProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const form = useCreateWorkspaceForm({ platform, onCreate });
  const rememberLabel = t('bootstrap:unlock.rememberHere', { label: form.biometric.label });
  const locationOptions: readonly OptionGridItem<WorkspaceLocation>[] = [
    { icon: Cloud, label: t('bootstrap:create.locationCloud'), value: 'cloud' },
    { icon: Smartphone, label: t('bootstrap:create.locationDevice'), value: 'device' },
  ];

  return (
    <Sheet
      closeLabel={t('bootstrap:create.close')}
      footer={
        <Button disabled={!form.canSubmit} label={t('bootstrap:create.submit')} onPress={() => void form.onSubmit()} />
      }
      isOpen={isOpen}
      onClose={onClose}
      title={t('bootstrap:create.title')}
    >
      <Text style={[styles.hint, { color: colors.muted }]}>{t('bootstrap:create.hint')}</Text>
      <Field label={t('bootstrap:create.name')} onChangeText={form.onNameChange} value={form.name} />
      {form.isCloudAvailable && (
        <View style={styles.location}>
          <Text style={[styles.locationTitle, { color: colors.foreground }]}>{t('bootstrap:create.location')}</Text>
          <OptionGrid
            accessibilityLabel={t('bootstrap:create.location')}
            columns={2}
            onChange={form.onLocationChange}
            options={locationOptions}
            value={form.location}
          />
          <Text style={[styles.hint, { color: colors.muted }]}>
            {form.location === 'cloud' ? t('bootstrap:create.cloudHint') : t('bootstrap:create.deviceHint')}
          </Text>
        </View>
      )}
      <OptionGrid
        accessibilityLabel={t('bootstrap:create.baseCurrency')}
        columns={3}
        onChange={form.onBaseCurrencyChange}
        options={CURRENCY_OPTIONS}
        value={form.baseCurrency}
      />
      <Field
        isSecret
        label={t('bootstrap:passphrase.labelWithMin', { min: MIN_PASSPHRASE_LENGTH })}
        onChangeText={form.onSecretChange}
        value={form.secret}
        {...(form.secretError === undefined ? {} : { error: form.secretError })}
      />
      <Field
        isSecret
        label={t('bootstrap:passphrase.confirmLabel')}
        onChangeText={form.onConfirmSecretChange}
        value={form.confirmSecret}
        {...(form.confirmError === undefined ? {} : { error: form.confirmError })}
        {...(form.confirmSuccess === undefined ? {} : { success: form.confirmSuccess })}
      />
      {form.biometric.isSupported && (
        <View style={styles.remember}>
          <Text style={[styles.rememberLabel, { color: colors.foreground }]}>{rememberLabel}</Text>
          <Switch accessibilityLabel={rememberLabel} onValueChange={form.onRememberChange} value={form.remember} />
        </View>
      )}
      {form.error !== undefined && (
        <Text accessibilityLiveRegion="polite" style={[styles.hint, { color: colors.neg }]}>
          {form.error}
        </Text>
      )}
      {form.location === 'device' && (
        <View style={styles.location}>
          <Text style={[styles.locationTitle, { color: colors.foreground }]}>
            {t('bootstrap:create.saveCopyTitle')}
          </Text>
          <Text style={[styles.hint, { color: colors.muted }]}>
            {form.backupFolder === null ? t('bootstrap:create.saveCopyHint') : t('bootstrap:create.saveCopyHintChosen')}
          </Text>
          <Button
            icon={FolderOpen}
            label={
              form.backupFolder === null
                ? t('bootstrap:create.chooseFolder')
                : t('bootstrap:create.chooseAnotherFolder')
            }
            onPress={() => void form.onChooseBackupFolder()}
            tone="outline"
          />
          {form.backupFolder !== null && (
            <Button label={t('bootstrap:create.noCopy')} onPress={form.onClearBackupFolder} tone="outline" />
          )}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, lineHeight: 18, marginBottom: SPACING.xs },
  location: { gap: SPACING.xs, marginTop: SPACING.sm },
  locationTitle: { fontSize: 15, fontWeight: '600' },
  remember: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  rememberLabel: { flex: 1, fontSize: 15 },
});
