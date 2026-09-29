import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

type SheetProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly onClose: () => void;
  /** `common:action.close` — passed in rather than translated here, so no primitive reaches for i18n. */
  readonly closeLabel: string;
  readonly children: ReactNode;
  /** Pinned under the scrollable body — the submit/cancel row, never part of the scroll. */
  readonly footer?: ReactNode;
};

/**
 * The bottom sheet every mobile dialog uses — the native stand-in for @repo/ui's `Dialog`
 * (docs/spec/ui-inventory-mobile.md §1). React Native's own `Modal` rather than a new
 * dependency: it already owns the platform's presentation, the hardware back button
 * (`onRequestClose`) and the accessibility focus behaviour.
 *
 * No `z-index` scale to respect here, unlike cross-app-pitfalls.md #1's DOM counterpart — a
 * native `Modal` is presented by the OS above the whole app, so stacking is presentation order,
 * not paint order.
 */
export function Sheet({ isOpen, title, onClose, closeLabel, children, footer }: SheetProps) {
  const { colors } = useColor();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={isOpen}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        {/* The backdrop is the dismiss affordance. Not announced as a button: that would read the
            whole screen out as one control — the header's close button is the announced way out. */}
        <Pressable accessible={false} onPress={onClose} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoider}>
          <View style={[styles.sheet, { backgroundColor: colors.elevated, borderTopColor: colors.border }]}>
            <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
              <Pressable
                accessibilityLabel={closeLabel}
                accessibilityRole="button"
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: colors.surfaceAlt }]}
              >
                <X color={colors.muted} size={16} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              style={styles.bodyScroll}
            >
              {children}
            </ScrollView>
            {footer !== undefined && <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View>}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: SPACING.md, padding: SPACING.gutter, paddingTop: SPACING.sm },
  bodyScroll: { flexGrow: 0, flexShrink: 1 },
  closeButton: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, gap: SPACING.sm, padding: SPACING.gutter },
  grabber: { alignSelf: 'center', borderRadius: BORDER_RADIUS.full, height: 4, marginTop: SPACING.sm, width: 36 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.md,
  },
  keyboardAvoider: { justifyContent: 'flex-end', maxHeight: '90%' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
  },
  title: { flexShrink: 1, fontSize: FONT_SIZE.headingSm, fontWeight: '600' },
});
