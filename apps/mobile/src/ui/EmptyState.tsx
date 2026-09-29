import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Avatar } from './Avatar';
import { Button } from './Button';

type EmptyStateProps = {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly subtitle?: string;
  /** Present together with `onAction`, or not at all. */
  readonly actionLabel?: string;
  readonly onAction?: () => void;
};

/** The "nothing here yet" block a list falls back to. Unlike `ComingSoon` every string is passed in
 * already translated, so this is a real product state rather than a placeholder. */
export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useColor();

  return (
    <View style={styles.container}>
      <Avatar color={colors.muted} icon={icon} size={44} soft />
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle !== undefined && <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>}
      {actionLabel !== undefined && onAction !== undefined && (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} tone="outline" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  action: { marginTop: SPACING.sm },
  container: { alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.gutter, paddingVertical: SPACING.xl },
  subtitle: { fontSize: FONT_SIZE.bodySm, textAlign: 'center' },
  title: { fontSize: FONT_SIZE.headingSm, fontWeight: '600', textAlign: 'center' },
});
