import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, HEIGHT, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

/**
 * Settings itself isn't built yet (docs/spec/screens-mobile.md) — the one real thing it exposes
 * so far is the entry point into onboarding, which needs a live route or it'd be dead code.
 * Logic-free, so it stays a single file per CLAUDE.md's MVVM exception for primitives.
 */
export function SettingsPlaceholder() {
  const { colors } = useColor();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Coming soon.</Text>
      <Link asChild href="/onboarding">
        <Text
          role="button"
          style={[
            styles.link,
            { backgroundColor: colors.chipBg, color: colors.foreground, borderColor: colors.border },
          ]}
        >
          Set up a new workspace
        </Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: FONT_SIZE.body,
    fontWeight: '500',
    height: HEIGHT.control,
    lineHeight: HEIGHT.control,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    textAlign: 'center',
  },
  screen: {
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
    justifyContent: 'center',
    padding: SPACING.gutter,
  },
  subtitle: {
    fontSize: FONT_SIZE.body,
  },
  title: {
    fontSize: FONT_SIZE.heading,
    fontWeight: '600',
  },
});
