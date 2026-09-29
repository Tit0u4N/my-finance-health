import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, LETTER_SPACING, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Card } from './Card';

type SectionGroupProps = {
  readonly title: string;
  readonly children: ReactNode;
};

/** An uppercase muted caption above a zero-padding `Card` — the shape every Settings screen's row
 * groups share (ui.jsx's `SectionGroup`). Logic-free, so it stays a single file per CLAUDE.md's
 * MVVM exception for primitives. */
export function SectionGroup({ title, children }: SectionGroupProps) {
  const { colors } = useColor();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.muted }]}>{title}</Text>
      <Card padding={0} style={styles.card}>
        {children}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  container: { gap: SPACING.sm },
  title: {
    fontSize: FONT_SIZE.caption,
    fontWeight: '600',
    letterSpacing: LETTER_SPACING.wide,
    paddingHorizontal: SPACING.xs,
    textTransform: 'uppercase',
  },
});
