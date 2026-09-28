import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, HEIGHT, SPACING } from '@/theme/tokens';

type BadgeProps = {
  readonly children: ReactNode;
  readonly color: string;
  readonly icon?: LucideIcon;
  readonly size?: 'sm' | 'md';
};

const SOFT_BACKGROUND_ALPHA = '1A'; // ~10% alpha hex suffix, matches ui.jsx's `${color}1A`.

/**
 * A soft-tinted pill in an arbitrary color — the KPI delta ("+12%") and status ("Encrypted")
 * chips across the mockup (ui.jsx's `Badge`). Replaces this file's previous single-purpose
 * uppercase label chip, whose only caller was the now-removed landing placeholder.
 */
export function Badge({ children, color, icon: Icon, size = 'md' }: BadgeProps) {
  const height = size === 'sm' ? HEIGHT.badge - 4 : HEIGHT.badge;

  return (
    <View style={[styles.container, { backgroundColor: `${color}${SOFT_BACKGROUND_ALPHA}`, height }]}>
      {Icon && <Icon color={color} size={size === 'sm' ? 11 : 12} />}
      <Text style={[styles.label, { color, fontSize: size === 'sm' ? FONT_SIZE.caption : FONT_SIZE.label }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  label: {
    fontWeight: '600',
  },
});
