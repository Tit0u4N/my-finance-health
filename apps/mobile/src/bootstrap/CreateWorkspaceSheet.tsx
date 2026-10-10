import type { CreateWorkspaceInput } from '@repo/data/workspace/workspaceOpener';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { Platform } from '@repo/platform/platform';
import { FolderOpen } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { OptionGrid, type OptionGridItem } from '@/ui/OptionGrid';
import { Sheet } from '@/ui/Sheet';
import { useCreateWorkspaceForm } from './useCreateWorkspaceForm';

const CURRENCY_OPTIONS: readonly OptionGridItem<CurrencyCode>[] = [
  { glyph: '€', label: 'EUR', value: 'EUR' },
  { glyph: '$', label: 'USD', value: 'USD' },
  { glyph: '£', label: 'GBP', value: 'GBP' },
];

type CreateWorkspaceSheetProps = {
  readonly isOpen: boolean;
  readonly platform: Platform;
  readonly onClose: () => void;
  readonly onCreate: (ref: WorkspaceRef, input: CreateWorkspaceInput, backupFolder: string | null) => void;
};

/** New encrypted workspace, stored on this device. The passphrase is the only key: nothing can
 * recover the data without it (start-roadmap.md §9 — "never a silent device-keyring unlock"). */
export function CreateWorkspaceSheet({ isOpen, platform, onClose, onCreate }: CreateWorkspaceSheetProps) {
  const { colors } = useColor();
  const form = useCreateWorkspaceForm({ platform, onCreate });

  return (
    <Sheet
      closeLabel="Close"
      footer={<Button disabled={!form.canSubmit} label="Create workspace" onPress={() => void form.onSubmit()} />}
      isOpen={isOpen}
      onClose={onClose}
      title="New workspace"
    >
      <Text style={[styles.hint, { color: colors.muted }]}>
        Stored encrypted in this app's private storage on this device. There is no way to recover it without the
        passphrase.
      </Text>
      <Field label="Name" onChangeText={form.onNameChange} value={form.name} />
      <OptionGrid
        accessibilityLabel="Base currency"
        columns={3}
        onChange={form.onBaseCurrencyChange}
        options={CURRENCY_OPTIONS}
        value={form.baseCurrency}
      />
      <Field
        isSecret
        label={`Passphrase (${form.minPassphraseLength}+ characters)`}
        onChangeText={form.onSecretChange}
        value={form.secret}
      />
      <Field
        isSecret
        label="Confirm passphrase"
        onChangeText={form.onConfirmSecretChange}
        value={form.confirmSecret}
        {...(form.error === undefined ? {} : { error: form.error })}
      />
      <View style={styles.location}>
        <Text style={[styles.locationTitle, { color: colors.foreground }]}>Save a copy to</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          {form.backupFolder === null
            ? 'Optional. Pick a folder — iCloud Drive, On My iPhone, another provider — and a copy is saved there as soon as the workspace is created.'
            : 'A copy will be saved in the folder you picked as soon as the workspace is created.'}
        </Text>
        <Button
          icon={FolderOpen}
          label={form.backupFolder === null ? 'Choose a folder…' : 'Choose another folder…'}
          onPress={() => void form.onChooseBackupFolder()}
          tone="outline"
        />
        {form.backupFolder !== null && (
          <Button label="Don't save a copy" onPress={form.onClearBackupFolder} tone="outline" />
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, lineHeight: 18, marginBottom: SPACING.xs },
  location: { gap: SPACING.xs, marginTop: SPACING.sm },
  locationTitle: { fontSize: 15, fontWeight: '600' },
});
