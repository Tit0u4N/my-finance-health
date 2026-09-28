import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { BORDER_RADIUS, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

type CardProps = {
  readonly children: ReactNode;
  readonly padding?: number;
  readonly style?: StyleProp<ViewStyle>;
};

/** Native counterpart of every bordered panel the mockup wraps in (ui.jsx's `Card`) — the one
 * container shape every screen composes with (docs/spec/ui-inventory-mobile.md §1). */
export function Card({ children, padding = SPACING.gutter, style }: CardProps) {
  const { colors } = useColor();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
