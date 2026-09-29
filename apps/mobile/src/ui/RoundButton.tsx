import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { ACCENT, BORDER_RADIUS } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

type RoundButtonProps = {
  readonly icon: LucideIcon;
  /** Icon-only, so a spoken name is mandatory rather than optional. */
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  /** `fill` is the accent-filled primary action (the header's `+`); `ghost` the quiet row affordance. */
  readonly variant?: 'fill' | 'ghost';
  readonly size?: number;
};

const ICON_RATIO = 0.45;

/** The mockup's `RoundBtn` (ui.jsx) — an icon-only circular pressable. On the `fill` variant the
 * glyph is explicitly white rather than inherited: nothing inherits colour on native, and the
 * accent fill needs an on-accent tone either way (cross-app-pitfalls.md #4). */
export function RoundButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  variant = 'fill',
  size = 40,
}: RoundButtonProps) {
  const { colors } = useColor();
  const isFilled = variant === 'fill';

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isFilled ? ACCENT : colors.surfaceAlt,
          height: size,
          opacity: pressed ? 0.85 : 1,
          width: size,
        },
      ]}
    >
      <Icon color={isFilled ? '#FFFFFF' : colors.muted} size={Math.round(size * ICON_RATIO)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    flexShrink: 0,
    justifyContent: 'center',
  },
});
