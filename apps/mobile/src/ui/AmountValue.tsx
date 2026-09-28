import { StyleSheet, Text, type TextStyle } from 'react-native';
import { useColor } from '@/theme/useColor';

export type AmountValueTone = 'default' | 'positive' | 'negative' | 'muted' | 'onAccent';

type AmountValueProps = {
  /** Already formatted by the money-formatting selector (app-core-inventory.md §6) — never a raw amount here. */
  readonly value: string;
  /** The privacy-blur toggle every money value in the app supports (app-core-inventory.md §3). */
  readonly hidden?: boolean;
  readonly tone?: AmountValueTone;
  readonly style?: TextStyle;
};

const MASK = '••••';

/** Native counterpart of @repo/ui's `AmountValue` — every money-bearing spot renders through
 * this, so the amounts-hidden preference only ever has to be threaded as a prop. */
export function AmountValue({ value, hidden = false, tone = 'default', style }: AmountValueProps) {
  const { colors } = useColor();

  const toneColor: Record<AmountValueTone, string> = {
    default: colors.foreground,
    positive: colors.pos,
    negative: colors.neg,
    muted: colors.muted,
    onAccent: '#FFFFFF',
  };

  return <Text style={[styles.value, { color: toneColor[tone] }, style]}>{hidden ? MASK : value}</Text>;
}

const styles = StyleSheet.create({
  value: {
    fontVariant: ['tabular-nums'],
  },
});
