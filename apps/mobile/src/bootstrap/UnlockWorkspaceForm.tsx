import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { Lock } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { useUnlockWorkspaceForm } from './useUnlockWorkspaceForm';

type UnlockWorkspaceFormProps = {
  readonly workspaceRef: WorkspaceRef;
  readonly onUnlock: (ref: WorkspaceRef, secret: string) => void;
  readonly onChooseAnother: () => void;
};

export function UnlockWorkspaceForm({ workspaceRef, onUnlock, onChooseAnother }: UnlockWorkspaceFormProps) {
  const { colors } = useColor();
  const form = useUnlockWorkspaceForm({ workspaceRef, onUnlock });

  return (
    <View style={styles.container}>
      <Avatar color={colors.muted} icon={Lock} size={44} soft />
      <Text style={[styles.title, { color: colors.foreground }]}>{workspaceRef.label}</Text>
      <Text style={[styles.hint, { color: colors.muted }]}>Enter the passphrase to unlock this workspace.</Text>
      <View style={styles.field}>
        <Field
          autoFocus
          isSecret
          label="Passphrase"
          onChangeText={form.onSecretChange}
          onSubmitEditing={form.onSubmit}
          returnKeyType="go"
          value={form.secret}
        />
      </View>
      <View style={styles.actions}>
        <Button disabled={!form.canSubmit} label="Unlock" onPress={form.onSubmit} />
        <Button label="Choose another workspace" onPress={onChooseAnother} tone="outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { alignSelf: 'stretch', gap: SPACING.sm },
  container: { alignItems: 'center', gap: SPACING.sm, padding: SPACING.gutter },
  field: { alignSelf: 'stretch', marginVertical: SPACING.sm },
  hint: { fontSize: 14, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
});
