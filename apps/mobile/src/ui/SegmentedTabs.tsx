import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

export type SegmentedTone = 'positive' | 'negative';

export type SegmentedOption<Value extends string> = {
  readonly value: Value;
  readonly label: string;
  /**
   * Semantic tone for the active state. Required by docs/spec/cross-app-pitfalls.md #8 whenever
   * the two sides are an already-coloured domain distinction (income/expense) — a neutral grey
   * active state would be the exact bug that entry records.
   */
  readonly tone?: SegmentedTone;
};

type SegmentedTabsProps<Value extends string> = {
  readonly options: readonly SegmentedOption<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  readonly accessibilityLabel?: string;
};

/** Native counterpart of @repo/ui's `Tabs` — a track with one raised active segment. */
export function SegmentedTabs<Value extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedTabsProps<Value>) {
  const { colors } = useColor();

  return (
    <View
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
      accessibilityRole="tablist"
      style={[styles.track, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const toneColor = option.tone === 'positive' ? colors.pos : option.tone === 'negative' ? colors.neg : undefined;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              isActive && {
                backgroundColor: colors.surface,
                borderColor: toneColor ?? colors.border,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, { color: isActive ? (toneColor ?? colors.foreground) : colors.muted }]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: FONT_SIZE.labelStrong, fontWeight: '600' },
  segment: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  track: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACING.xs,
    padding: SPACING.xs,
  },
});
