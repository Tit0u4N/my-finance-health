import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from './Button';
import { Sheet } from './Sheet';

type ConfirmSheetProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description?: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly closeLabel: string;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly isSubmitting?: boolean;
};

/** Native stand-in for @repo/ui's `ConfirmDialog`: every destructive action goes through this rather
 * than deleting straight from a row tap. */
export function ConfirmSheet({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  closeLabel,
  onConfirm,
  onClose,
  isSubmitting = false,
}: ConfirmSheetProps) {
  const { colors } = useColor();

  return (
    <Sheet
      closeLabel={closeLabel}
      footer={
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button disabled={isSubmitting} label={cancelLabel} onPress={onClose} tone="outline" />
          </View>
          <View style={styles.action}>
            <Button disabled={isSubmitting} label={confirmLabel} onPress={onConfirm} tone="danger" />
          </View>
        </View>
      }
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      {description !== undefined && <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  action: { flex: 1 },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  description: { fontSize: FONT_SIZE.body, lineHeight: 20 },
});
