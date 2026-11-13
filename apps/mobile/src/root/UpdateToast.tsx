import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACCENT, BORDER_RADIUS, FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { useUpdateToast } from './useUpdateToast';

/** Non-blocking "update ready" toast, floated over the current screen. Render-nothing when idle. */
export function UpdateToast() {
  const { isVisible, handleRestart, handleDismiss } = useUpdateToast();
  const { colors } = useColor();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      entering={FadeInUp}
      exiting={FadeOutUp}
      pointerEvents="box-none"
      style={[
        styles.box,
        { backgroundColor: colors.surface, borderColor: colors.border, top: insets.top + SPACING.sm },
      ]}
    >
      <Text style={[styles.message, { color: colors.foreground }]}>{t('common:update.ready')}</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" hitSlop={SPACING.sm} onPress={handleDismiss}>
          <Text style={[styles.action, { color: colors.foreground }]}>{t('common:update.later')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={SPACING.sm} onPress={handleRestart}>
          <Text style={[styles.action, { color: ACCENT }]}>{t('common:update.restart')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  action: { fontSize: FONT_SIZE.bodySm, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: SPACING.md },
  box: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: SPACING.gutter,
    padding: SPACING.md,
    position: 'absolute',
    right: SPACING.gutter,
  },
  message: { flex: 1, fontSize: FONT_SIZE.bodySm },
});
