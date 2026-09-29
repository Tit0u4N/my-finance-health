import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, HEIGHT, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Chip } from './Chip';
import { Sheet } from './Sheet';

export type ChipSelectOption = {
  readonly value: string;
  readonly label: string;
  /** The record's own identity colour, when the option is an entity (cross-app-pitfalls.md #7). */
  readonly color?: string;
};

type ChipSelectProps = {
  /** Names the control for screen readers and titles the option sheet. */
  readonly label: string;
  readonly value: string;
  readonly options: readonly ChipSelectOption[];
  readonly onChange: (value: string) => void;
  /** True when the current value is a real narrowing choice rather than the "all" default. */
  readonly selected?: boolean;
  readonly closeLabel: string;
};

/**
 * The native stand-in for @repo/ui's `Select`: a closed `Chip` that opens a `Sheet` of options
 * with a check on the current one. A wheel/native picker would need a new dependency
 * (`@react-native-picker/picker`), which this pass has not approved.
 *
 * Single file despite the `useState`: open/closed is this control's own disclosure state, not
 * screen logic — the same reason @repo/ui's own primitives keep theirs internal.
 */
export function ChipSelect({ label, value, options, onChange, selected = false, closeLabel }: ChipSelectProps) {
  const { colors } = useColor();
  const [isOpen, setIsOpen] = useState(false);

  const current = options.find((option) => option.value === value);

  return (
    <>
      <Chip
        accessibilityLabel={label}
        label={current?.label ?? label}
        onPress={() => setIsOpen(true)}
        selected={selected}
        trailingIcon={ChevronDown}
        {...(current?.color === undefined ? {} : { color: current.color })}
      />
      <Sheet closeLabel={closeLabel} isOpen={isOpen} onClose={() => setIsOpen(false)} title={label}>
        <View style={styles.optionList}>
          {options.map((option) => {
            const isCurrent = option.value === value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isCurrent }}
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={[styles.option, { backgroundColor: isCurrent ? colors.surfaceAlt : 'transparent' }]}
              >
                {option.color !== undefined && <View style={[styles.dot, { backgroundColor: option.color }]} />}
                <Text numberOfLines={1} style={[styles.optionLabel, { color: colors.foreground }]}>
                  {option.label}
                </Text>
                {isCurrent && <Check color={colors.pos} size={17} />}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  dot: { borderRadius: BORDER_RADIUS.full, flexShrink: 0, height: 10, width: 10 },
  option: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    minHeight: HEIGHT.control,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  optionLabel: { flex: 1, fontSize: FONT_SIZE.body },
  optionList: { gap: SPACING.xs },
});
