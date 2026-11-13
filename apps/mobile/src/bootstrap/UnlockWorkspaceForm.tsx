import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { BiometricUnlockService } from '@repo/platform/services/biometricUnlock';
import { Lock, ScanFace } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Switch } from '@/ui/Switch';
import { useUnlockWorkspaceForm } from './useUnlockWorkspaceForm';

type UnlockWorkspaceFormProps = {
  readonly workspaceRef: WorkspaceRef;
  readonly biometricUnlock: BiometricUnlockService | undefined;
  readonly onUnlock: (ref: WorkspaceRef, secret: string, remember: boolean, sourcedFromBiometric: boolean) => void;
  readonly onChooseAnother: () => void;
};

export function UnlockWorkspaceForm({
  workspaceRef,
  biometricUnlock,
  onUnlock,
  onChooseAnother,
}: UnlockWorkspaceFormProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const form = useUnlockWorkspaceForm({ workspaceRef, biometricUnlock, onUnlock });
  const rememberLabel = t('bootstrap:unlock.remember', { label: form.biometric.label });
  const unlockWithLabel = t('bootstrap:unlock.unlockWith', { label: form.biometric.label });

  return (
    <View style={styles.container}>
      <Avatar color={colors.muted} icon={Lock} size={44} soft />
      <Text style={[styles.title, { color: colors.foreground }]}>{workspaceRef.label}</Text>
      <Text style={[styles.hint, { color: colors.muted }]}>{t('bootstrap:unlock.hint')}</Text>
      <View style={styles.field}>
        <Field
          autoFocus={!form.biometric.isEnrolled}
          isSecret
          label={t('bootstrap:passphrase.label')}
          onChangeText={form.onSecretChange}
          onSubmitEditing={form.onSubmit}
          returnKeyType="go"
          value={form.secret}
        />
      </View>
      {form.biometric.isSupported && (
        <View style={styles.remember}>
          <Text style={[styles.rememberLabel, { color: colors.foreground }]}>{rememberLabel}</Text>
          <Switch accessibilityLabel={rememberLabel} onValueChange={form.onRememberChange} value={form.remember} />
        </View>
      )}
      <View style={styles.actions}>
        <Button disabled={!form.canSubmit} label={t('bootstrap:unlock.submit')} onPress={form.onSubmit} />
        {form.biometric.isSupported && form.biometric.isEnrolled && (
          <Button icon={ScanFace} label={unlockWithLabel} onPress={form.onBiometricUnlock} tone="outline" />
        )}
        <Button label={t('bootstrap:error.chooseAnother')} onPress={onChooseAnother} tone="outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { alignSelf: 'stretch', gap: SPACING.sm },
  container: { alignItems: 'center', gap: SPACING.sm, padding: SPACING.gutter },
  field: { alignSelf: 'stretch', marginVertical: SPACING.sm },
  hint: { fontSize: 14, textAlign: 'center' },
  remember: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  rememberLabel: { flex: 1, fontSize: 15 },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
});
