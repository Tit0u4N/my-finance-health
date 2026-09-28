import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, HEIGHT, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

type FieldProps = {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  readonly keyboardType?: 'default' | 'decimal-pad';
};

/** Native counterpart of the mockup's labelled text input (ui.jsx's `Field`). Logic-free, so it
 * stays a single file per CLAUDE.md's MVVM exception for primitives. */
export function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: FieldProps) {
  const { colors } = useColor();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        style={[
          styles.input,
          { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.foreground },
        ]}
        {...(keyboardType === 'decimal-pad' ? { keyboardType } : {})}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  input: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: FONT_SIZE.body,
    height: HEIGHT.control,
    paddingHorizontal: SPACING.md,
  },
  label: { fontSize: FONT_SIZE.label, fontWeight: '500' },
});
