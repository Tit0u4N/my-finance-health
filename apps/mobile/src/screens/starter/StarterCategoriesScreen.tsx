import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { type StarterCategoryRow, useStarterCategories } from '@repo/app-core/starter/useStarterCategories';
import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from '@/ui/Button';

type StarterCategoriesScreenProps = {
  /** Called once the step is finished or skipped — the app root then shows the main screens. */
  readonly onDone: () => void;
};

/** Shown once, right after a workspace is created (audit P1). All logic is in
 * `@repo/app-core`'s `useStarterCategories`, shared with desktop; this file only lays it out. */
export function StarterCategoriesScreen({ onDone }: StarterCategoriesScreenProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const starter = useStarterCategories(onDone);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('bootstrap:starter.title')}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{t('bootstrap:starter.hint')}</Text>
        <View style={styles.columns}>
          <Column rows={starter.income} title={t('bootstrap:starter.income')} onToggle={starter.onToggle} />
          <Column rows={starter.expense} title={t('bootstrap:starter.expense')} onToggle={starter.onToggle} />
        </View>
        {starter.hasError && <Text style={{ color: colors.neg }}>{t('bootstrap:starter.error')}</Text>}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
        <Button
          disabled={starter.isSaving}
          label={
            starter.selectedCount === 0
              ? t('bootstrap:starter.confirmNone')
              : t('bootstrap:starter.confirm', { count: starter.selectedCount })
          }
          onPress={() => void starter.onConfirm()}
        />
        {starter.selectedCount > 0 && (
          <Button
            disabled={starter.isSaving}
            label={t('bootstrap:starter.skip')}
            onPress={starter.onSkip}
            tone="outline"
          />
        )}
      </View>
    </View>
  );
}

function Column({
  title,
  rows,
  onToggle,
}: {
  readonly title: string;
  readonly rows: readonly StarterCategoryRow[];
  readonly onToggle: (key: StarterCategoryRow['key']) => void;
}) {
  const { colors } = useColor();
  return (
    <View style={styles.column}>
      <Text style={{ color: colors.foreground, fontWeight: '600' }}>{title}</Text>
      {rows.map((row) => (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: row.enabled }}
          key={row.key}
          onPress={() => onToggle(row.key)}
          style={[styles.row, { opacity: row.enabled ? 1 : 0.55 }]}
        >
          <View style={[styles.dot, { backgroundColor: row.color }]} />
          <Text style={{ color: colors.foreground, flex: 1, fontSize: FONT_SIZE.bodySm }}>{row.name}</Text>
          <View
            style={[
              styles.check,
              {
                backgroundColor: row.enabled ? colors.pos : 'transparent',
                borderColor: row.enabled ? colors.pos : colors.border,
              },
            ]}
          >
            {row.enabled && <Check color="#FFFFFF" size={12} />}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  column: { flex: 1, gap: SPACING.sm },
  columns: { flexDirection: 'row', gap: SPACING.md },
  content: { gap: SPACING.md, padding: SPACING.gutter },
  dot: { borderRadius: 99, flexShrink: 0, height: 10, width: 10 },
  footer: { gap: SPACING.sm, paddingHorizontal: SPACING.gutter, paddingTop: SPACING.sm },
  hint: { fontSize: FONT_SIZE.body, lineHeight: 20 },
  row: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, minHeight: 36 },
  screen: { flex: 1 },
  title: { fontSize: FONT_SIZE.heading, fontWeight: '600' },
});
