import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Badge } from './Badge';
import { Button } from './Button';
import { FeatureCard } from './FeatureCard';

export type LandingFeature = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
};

export type LandingPageProps = {
  readonly productName: string;
  readonly targetLabel: string;
  readonly tagline: string;
  readonly description: string;
  readonly features: readonly LandingFeature[];
  readonly primaryActionLabel: string;
  readonly onPrimaryAction: () => void;
  readonly footnote: string;
};

/**
 * Native landing page. Its props mirror the DOM `LandingPage` of @repo/ui so both targets say the same thing,
 * but no line of rendering is shared: mobile owns its presentation layer end to end.
 */
export function LandingPage({
  productName,
  targetLabel,
  tagline,
  description,
  features,
  primaryActionLabel,
  onPrimaryAction,
  footnote,
}: LandingPageProps) {
  const { colors } = useColor();

  return (
    <ScrollView contentContainerStyle={styles.content} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Badge label={targetLabel} />
        <Text style={[styles.productName, { color: colors.foreground }]}>{productName}</Text>
        <Text style={[styles.tagline, { color: colors.muted }]}>{tagline}</Text>
      </View>

      <Text style={[styles.description, { color: colors.foreground }]}>{description}</Text>

      <View style={styles.features}>
        {features.map((feature) => (
          <FeatureCard description={feature.description} key={feature.id} title={feature.title} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button label={primaryActionLabel} onPress={onPrimaryAction} />
        <Text style={[styles.footnote, { color: colors.muted }]}>{footnote}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.md,
  },
  content: {
    flexGrow: 1,
    gap: SPACING.xl,
    justifyContent: 'center',
    paddingHorizontal: SPACING.gutter,
    paddingVertical: SPACING.section,
  },
  description: {
    fontSize: FONT_SIZE.body,
    lineHeight: FONT_SIZE.heading,
  },
  features: {
    gap: SPACING.gutter,
  },
  footnote: {
    fontSize: FONT_SIZE.bodySm,
  },
  header: {
    gap: SPACING.md,
  },
  productName: {
    fontSize: FONT_SIZE.heading,
    fontWeight: '600',
  },
  screen: {
    flex: 1,
  },
  tagline: {
    fontSize: FONT_SIZE.heading,
  },
});
