import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ACCENT, BORDER_RADIUS, FONT_SIZE, HEIGHT, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

export type ButtonTone = 'primary' | 'outline' | 'danger' | 'dashed';

type ButtonProps = {
  readonly label: string;
  readonly tone?: ButtonTone;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  /** Leading icon, tinted with the label's own colour — the delete sheet's `Trash2`, the empty state's `Plus`. */
  readonly icon?: LucideIcon;
};

/** Native counterpart of the `Button` primitive of @repo/ui. Same tones, no shared code: the rendering
 * boundary stops at the DOM (docs/start-roadmap.md §2). */
export function Button({ label, tone = 'primary', onPress, disabled = false, icon: Icon }: ButtonProps) {
  const { colors } = useColor();

  // `danger` is a filled destructive button, not an outline one: it confirms a delete, and the
  // confirm sheet's other action is the (outline) cancel — the two must not read alike.
  const background = tone === 'primary' ? ACCENT : tone === 'danger' ? colors.neg : 'transparent';
  const isFilled = tone === 'primary' || tone === 'danger';
  // `dashed` reads as a muted, inviting affordance ("add another…") rather than a real button, so
  // it takes the accent for its label/border instead of `foreground` — same intent as `soft` in
  // the design mock, without adding a fourth background treatment.
  const labelColor = isFilled ? '#FFFFFF' : tone === 'dashed' ? ACCENT : colors.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        tone === 'dashed' && styles.dashed,
        {
          backgroundColor: background,
          borderColor: tone === 'dashed' ? colors.borderStrong : colors.border,
          borderWidth: tone === 'dashed' ? 1.5 : isFilled ? 0 : StyleSheet.hairlineWidth,
          opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
        },
      ]}
    >
      {Icon && <Icon color={labelColor} size={16} />}
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    gap: SPACING.xs,
    height: HEIGHT.control,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  dashed: { borderStyle: 'dashed' },
  label: {
    fontSize: FONT_SIZE.body,
    fontWeight: '500',
  },
});
