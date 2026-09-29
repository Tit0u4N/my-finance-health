import { categoricalPaletteHex } from '@repo/design-tokens/colors';
import { Pressable, StyleSheet, View } from 'react-native';
import { BORDER_RADIUS, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

/** The 8-swatch default offered by a category colour picker — `design-system.md` §3: "assign
 * `categorical-(n mod 8)` to the n-th created record". Same source as @repo/ui's own
 * `CATEGORY_SWATCHES` re-export, imported directly: `@repo/design-tokens` is not on the
 * `apps/mobile/**` `noRestrictedImports` list (only the platform adapters and `@repo/ui`/
 * `@repo/routes`/`@repo/router` are). */
export const CATEGORY_SWATCHES: readonly string[] = categoricalPaletteHex;

type ColorSwatchPickerProps = {
  readonly value: string;
  readonly onChange: (color: string) => void;
  readonly swatches?: readonly string[];
  readonly accessibilityLabel: string;
};

const SWATCH_SIZE = 34;

/** Native counterpart of @repo/ui's `ColorSwatchPicker` — a row of tappable colour discs, a ring
 * on the current one. */
export function ColorSwatchPicker({
  value,
  onChange,
  swatches = CATEGORY_SWATCHES,
  accessibilityLabel,
}: ColorSwatchPickerProps) {
  const { colors } = useColor();

  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="radiogroup" style={styles.row}>
      {swatches.map((swatch) => {
        const isChecked = swatch === value;
        return (
          <Pressable
            accessibilityLabel={swatch}
            accessibilityRole="radio"
            accessibilityState={{ checked: isChecked }}
            key={swatch}
            onPress={() => onChange(swatch)}
            style={[styles.ring, { borderColor: isChecked ? swatch : 'transparent', backgroundColor: colors.surface }]}
          >
            <View style={[styles.swatch, { backgroundColor: swatch }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    height: SWATCH_SIZE + 8,
    justifyContent: 'center',
    width: SWATCH_SIZE + 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  swatch: { borderRadius: BORDER_RADIUS.full, height: SWATCH_SIZE, width: SWATCH_SIZE },
});
