import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

type FeatureCardProps = {
  readonly title: string;
  readonly description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  const { colors } = useColor();

  return (
    <View style={[styles.container, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
    padding: SPACING.lg,
  },
  description: {
    fontSize: FONT_SIZE.sm,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
});
