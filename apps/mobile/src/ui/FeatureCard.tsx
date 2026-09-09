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
    <View style={[styles.container, { backgroundColor: colors.chipBg, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
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
    fontSize: FONT_SIZE.bodySm,
  },
  title: {
    fontSize: FONT_SIZE.headingSm,
    fontWeight: '500',
  },
});
