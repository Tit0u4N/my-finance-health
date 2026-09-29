import { type LucideIcon, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, HEIGHT, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

type FieldProps = {
  /** Omitted for the search input and the focal amount, both of which the surrounding layout names. */
  readonly label?: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  readonly keyboardType?: 'default' | 'decimal-pad';
  /** Leading glyph inside the input — the ledger search's `Search`. */
  readonly icon?: LucideIcon;
  /** Renders a trailing clear button whenever `value` is non-empty. */
  readonly onClear?: () => void;
  readonly autoFocus?: boolean;
  readonly returnKeyType?: 'done' | 'search';
  /** `focal` is the New-transaction sheet's oversized, centred amount entry. */
  readonly variant?: 'default' | 'focal';
  /** Spoken name when `label` is absent. */
  readonly accessibilityLabel?: string;
};

/** Native counterpart of the mockup's labelled text input (ui.jsx's `Field`). Logic-free, so it
 * stays a single file per CLAUDE.md's MVVM exception for primitives. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  icon: Icon,
  onClear,
  autoFocus = false,
  returnKeyType,
  variant = 'default',
  accessibilityLabel,
}: FieldProps) {
  const { colors } = useColor();
  const isFocal = variant === 'focal';
  const showClear = onClear !== undefined && value !== '';

  return (
    <View style={styles.container}>
      {label !== undefined && <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>}
      <View
        style={[
          styles.inputRow,
          isFocal ? styles.inputRowFocal : styles.inputRowDefault,
          { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        ]}
      >
        {Icon && <Icon color={colors.subtle} size={16} />}
        <TextInput
          autoFocus={autoFocus}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.subtle}
          style={[styles.input, isFocal && styles.inputFocal, { color: colors.foreground }]}
          {...(keyboardType === 'decimal-pad' ? { keyboardType } : {})}
          {...(returnKeyType ? { returnKeyType } : {})}
          {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
          value={value}
        />
        {showClear && (
          <Pressable accessibilityRole="button" onPress={onClear} style={styles.clearButton}>
            <X color={colors.muted} size={15} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: { padding: SPACING.xs },
  container: { gap: 6 },
  input: { flex: 1, fontSize: FONT_SIZE.body, height: '100%' },
  inputFocal: { fontSize: FONT_SIZE.valueHero, fontWeight: '600', textAlign: 'center' },
  inputRow: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  inputRowDefault: { height: HEIGHT.control },
  inputRowFocal: { height: HEIGHT.focalControl },
  label: { fontSize: FONT_SIZE.label, fontWeight: '500' },
});
