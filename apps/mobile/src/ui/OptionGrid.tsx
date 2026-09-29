import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ACCENT, BORDER_RADIUS, FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

export type OptionGridItem<Value extends string> = {
  readonly value: Value;
  readonly label: string;
  readonly icon?: LucideIcon;
  /** A large glyph line instead of an icon — the currency tiles' `€`/`$`/`£`. */
  readonly glyph?: string;
  readonly disabled?: boolean;
};

type OptionGridProps<Value extends string> = {
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  readonly options: readonly OptionGridItem<Value>[];
  readonly columns: 2 | 3;
  readonly accessibilityLabel: string;
};

/** Native counterpart of @repo/ui's `OptionGrid` — a single-select icon/label tile grid (Settings
 * → Preferences' Theme and Base currency, the New-account sheet's Type grid). `radiogroup`/`radio`
 * roles in place of base-ui's `RadioGroup`/`Radio`. */
export function OptionGrid<Value extends string>({
  value,
  onChange,
  options,
  columns,
  accessibilityLabel,
}: OptionGridProps<Value>) {
  const { colors } = useColor();

  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="radiogroup" style={styles.grid}>
      {options.map((option) => {
        const isChecked = option.value === value;
        const Icon = option.icon;
        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: isChecked, disabled: option.disabled ?? false }}
            disabled={option.disabled ?? false}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.tile,
              { width: `${100 / columns}%` },
              {
                opacity: option.disabled ? 0.4 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.tileInner,
                {
                  backgroundColor: isChecked ? `${ACCENT}1A` : colors.surfaceAlt,
                  borderColor: isChecked ? ACCENT : colors.border,
                },
              ]}
            >
              {Icon && <Icon color={isChecked ? ACCENT : colors.foreground} size={18} />}
              {option.glyph !== undefined && (
                <Text style={[styles.glyph, { color: isChecked ? ACCENT : colors.foreground }]}>{option.glyph}</Text>
              )}
              <Text numberOfLines={1} style={[styles.label, { color: isChecked ? ACCENT : colors.foreground }]}>
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: { fontSize: FONT_SIZE.heading, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  label: { fontSize: FONT_SIZE.label, fontWeight: '500' },
  tile: { padding: SPACING.xs / 2 },
  tileInner: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
  },
});
