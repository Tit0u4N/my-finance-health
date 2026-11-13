import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

/** Shown above the unlock form after another device took the workspace's occupancy lock over. */
export function LockLostNotice() {
  const { colors } = useColor();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.box, { backgroundColor: colors.surfaceAlt, marginTop: insets.top + SPACING.sm }]}
    >
      <Text style={{ color: colors.neg, fontSize: FONT_SIZE.bodySm }}>{t('bootstrap:unlock.lockLost')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 8, marginHorizontal: SPACING.gutter, padding: SPACING.md },
});
