import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, HEIGHT, LETTER_SPACING, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

type BadgeProps = {
  readonly label: string;
};

export function Badge({ label }: BadgeProps) {
  const { colors } = useColor();

  return (
    <View style={[styles.container, { backgroundColor: colors.chipBg, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.muted }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: HEIGHT.badge,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.caption,
    fontWeight: '500',
    letterSpacing: LETTER_SPACING.wide,
  },
});
