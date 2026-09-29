import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

type ScreenHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
  /** Right-aligned slot — the Activity tab's round `+`. */
  readonly trailing?: ReactNode;
};

/** The title/subtitle block every tab opens with (`headerShown: false` in `(tabs)/_layout.tsx`, so
 * each screen draws its own). Extracted from DashboardScreen's inline header once a second screen
 * needed the same shape. */
export function ScreenHeader({ title, subtitle, trailing }: ScreenHeaderProps) {
  const { colors } = useColor();

  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle !== undefined && <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, justifyContent: 'space-between' },
  subtitle: { fontSize: FONT_SIZE.bodySm },
  text: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: FONT_SIZE.heading, fontWeight: '600' },
});
