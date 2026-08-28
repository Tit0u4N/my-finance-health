import { Pressable, StyleSheet, Text } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, HEIGHT, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

type ButtonProps = {
  readonly label: string;
  readonly tone?: 'primary' | 'outline';
  readonly onPress: () => void;
};

/** Native counterpart of the `Button` primitive of @repo/ui. Same tones, no shared code: the rendering
 * boundary stops at the DOM (docs/start-roadmap.md §2). */
export function Button({ label, tone = 'primary', onPress }: ButtonProps) {
  const { colors } = useColor();
  const isPrimary = tone === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isPrimary ? colors.primary : 'transparent',
          borderColor: colors.border,
          borderWidth: isPrimary ? 0 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color: isPrimary ? colors.primaryForeground : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    height: HEIGHT.control,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
  },
});
