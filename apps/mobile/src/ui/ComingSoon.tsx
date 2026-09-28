import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

type ComingSoonProps = {
  readonly title: string;
};

/**
 * Placeholder for a tab whose real screen hasn't landed yet in this pass (docs/spec/screens-mobile.md).
 * Logic-free, so it stays a single file per CLAUDE.md's MVVM exception for primitives.
 */
export function ComingSoon({ title }: ComingSoonProps) {
  const { colors } = useColor();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.body,
  },
  title: {
    fontSize: FONT_SIZE.heading,
    fontWeight: '600',
  },
});
