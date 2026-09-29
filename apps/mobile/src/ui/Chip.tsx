import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ACCENT, BORDER_RADIUS, FONT_SIZE, HEIGHT, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

/** ~10% alpha hex suffix, the same tint `Badge` uses for a soft fill in an arbitrary colour. */
const SOFT_BACKGROUND_ALPHA = '1A';

type ChipProps = {
  readonly label: string;
  readonly selected?: boolean;
  /**
   * The record's own identity colour (`Category.color`, `Account.color`). Per
   * docs/spec/cross-app-pitfalls.md #7 it is rendered whether the chip is selected or not, and the
   * selected state tints *with* it instead of replacing it with the app accent.
   */
  readonly color?: string;
  readonly icon?: LucideIcon;
  /** Trailing glyph — `ChevronDown` on a chip that opens a picker, `X` on the filter-reset chip. */
  readonly trailingIcon?: LucideIcon;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
};

/** Pressable pill used for filters, pickers and category selection. Logic-free, so it stays a
 * single file per CLAUDE.md's MVVM exception for primitives. */
export function Chip({
  label,
  selected = false,
  color,
  icon: Icon,
  trailingIcon: TrailingIcon,
  onPress,
  accessibilityLabel,
}: ChipProps) {
  const { colors } = useColor();

  // A chip with no record colour falls back to the brand accent for its selected state; one that
  // has a colour keeps it in both states, only gaining the tinted fill and border when selected.
  const tint = color ?? ACCENT;
  const foreground = selected || color !== undefined ? tint : colors.foreground;

  return (
    <Pressable
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={onPress === undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: selected ? `${tint}${SOFT_BACKGROUND_ALPHA}` : colors.chipBg,
          borderColor: selected ? tint : 'transparent',
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {Icon && <Icon color={foreground} size={14} />}
      <Text numberOfLines={1} style={[styles.label, { color: selected ? tint : foreground }]}>
        {label}
      </Text>
      {TrailingIcon && <TrailingIcon color={selected ? tint : colors.muted} size={14} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACING.xs,
    height: HEIGHT.chip,
    paddingHorizontal: SPACING.md,
  },
  label: { flexShrink: 1, fontSize: FONT_SIZE.label, fontWeight: '500' },
});
