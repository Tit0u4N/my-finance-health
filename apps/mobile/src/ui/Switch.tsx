import { Switch as NativeSwitch } from 'react-native';
import { useColor } from '@/theme/useColor';

type SwitchProps = {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  /** Always supplied — the switch carries no visible label of its own in a list row. */
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
};

/**
 * React Native's own `Switch`, dressed in the palette. Wrapping rather than hand-rolling keeps the
 * platform's real `switch` accessibility role, its haptics and its animation — none of which a
 * `Pressable` + Reanimated reimplementation would give for free.
 *
 * `pos` for the on state, not the brand accent: "active" here is the same on/paused distinction the
 * rest of the app already colours green (cross-app-pitfalls.md #8).
 */
export function Switch({ value, onValueChange, accessibilityLabel, disabled = false }: SwitchProps) {
  const { colors } = useColor();

  return (
    <NativeSwitch
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      ios_backgroundColor={colors.borderStrong}
      onValueChange={onValueChange}
      thumbColor={colors.surface}
      trackColor={{ false: colors.borderStrong, true: colors.pos }}
      value={value}
    />
  );
}
