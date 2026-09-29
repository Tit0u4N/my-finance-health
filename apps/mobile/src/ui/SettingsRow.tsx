import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Avatar } from './Avatar';

type SettingsRowProps = {
  readonly icon: LucideIcon;
  readonly iconColor: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly onPress?: () => void;
  /** Overrides the trailing `ChevronRight` a pressable row gets by default — a `Switch`, for
   * instance. Absent and no `onPress` renders neither, for a purely informational row. */
  readonly trailing?: ReactNode;
  /** Hairline separator under the row — callers pass `!isLast` for a row inside a `SectionGroup`. */
  readonly showSeparator?: boolean;
  readonly accessibilityLabel?: string;
};

/** One row of a Settings `SectionGroup` — soft icon disc, title/subtitle stack, trailing chevron
 * or control (ui.jsx's `SettingsRow`). */
export function SettingsRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  trailing,
  showSeparator = false,
  accessibilityLabel,
}: SettingsRowProps) {
  const { colors } = useColor();

  const content = (
    <View
      style={[
        styles.row,
        showSeparator && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <Avatar color={iconColor} icon={icon} size={32} soft />
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.muted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing ?? (onPress !== undefined && <ChevronRight color={colors.subtle} size={16} />)}
    </View>
  );

  if (onPress === undefined) {
    return content;
  }

  return (
    <Pressable
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
      accessibilityRole="button"
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  subtitle: { fontSize: FONT_SIZE.caption, marginTop: 2 },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: FONT_SIZE.body, fontWeight: '500' },
});
