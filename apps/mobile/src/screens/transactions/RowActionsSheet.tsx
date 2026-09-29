import { Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, HEIGHT, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Sheet } from '@/ui/Sheet';
import type { RowActionsModel } from './useTransactionsScreen';

type RowActionsSheetProps = {
  readonly actions: RowActionsModel;
  readonly editLabel: string;
  readonly deleteLabel: string;
  readonly closeLabel: string;
};

/** Edit / Delete for one row — the native stand-in for desktop's `DropdownMenu`, which has no
 * native equivalent worth hand-rolling. Logic-free: every handler comes from the tab's ViewModel. */
export function RowActionsSheet({ actions, editLabel, deleteLabel, closeLabel }: RowActionsSheetProps) {
  const { colors } = useColor();

  return (
    <Sheet closeLabel={closeLabel} isOpen={actions.isOpen} onClose={actions.onClose} title={actions.title}>
      <View style={styles.list}>
        <Pressable
          accessibilityRole="button"
          onPress={actions.onEdit}
          style={[styles.action, { backgroundColor: colors.surfaceAlt }]}
        >
          <Pencil color={colors.foreground} size={17} />
          <Text style={[styles.label, { color: colors.foreground }]}>{editLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={actions.onDelete}
          style={[styles.action, { backgroundColor: colors.negSoft }]}
        >
          <Trash2 color={colors.neg} size={17} />
          <Text style={[styles.label, { color: colors.neg }]}>{deleteLabel}</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    height: HEIGHT.control,
    paddingHorizontal: SPACING.md,
  },
  label: { fontSize: FONT_SIZE.body, fontWeight: '500' },
  list: { gap: SPACING.sm },
});
