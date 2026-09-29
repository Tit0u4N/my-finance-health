import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Card } from '@/ui/Card';
import { ConfirmSheet } from '@/ui/ConfirmSheet';
import { RoundButton } from '@/ui/RoundButton';
import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { CategorySheet } from './CategorySheet';
import type { CategoryRow } from './useCategoriesScreen';
import { useCategoriesScreen } from './useCategoriesScreen';

type CategoriesScreenProps = {
  readonly onBack: () => void;
};

/** Settings → Categories (screens-invest-settings.jsx's `SettingsCategories`): an Expenses/Income
 * segmented switch over one list, each row with a colour swatch and edit/delete icon buttons. */
export function CategoriesScreen({ onBack }: CategoriesScreenProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const screen = useCategoriesScreen();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <RoundButton accessibilityLabel={t('common:action.back')} icon={ArrowLeft} onPress={onBack} variant="ghost" />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {screen.ready ? screen.title : t('settings:nav.categories.label')}
        </Text>
        {screen.ready && <RoundButton accessibilityLabel={screen.addLabel} icon={Plus} onPress={screen.onAdd} />}
      </View>

      {screen.ready ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SegmentedTabs onChange={screen.onTabChange} options={screen.tabOptions} value={screen.tab} />
          <Text style={[styles.count, { color: colors.muted }]}>{screen.countLabel}</Text>

          <Card padding={0} style={styles.rowsCard}>
            {screen.rows.map((row, index) => (
              <Row
                isLast={index === screen.rows.length - 1}
                key={row.id}
                onDelete={() => screen.onDelete(row.id)}
                onEdit={() => screen.onEdit(row.id)}
                row={row}
                screen={screen}
              />
            ))}
          </Card>

          <CategorySheet form={screen.form} />
          <ConfirmSheet
            cancelLabel={t('common:action.cancel')}
            closeLabel={t('common:action.close')}
            confirmLabel={t('common:action.delete')}
            description={screen.deleteDialog.description}
            isOpen={screen.deleteDialog.isOpen}
            isSubmitting={screen.deleteDialog.isSubmitting}
            onClose={screen.deleteDialog.onClose}
            onConfirm={screen.deleteDialog.onConfirm}
            title={screen.deleteDialog.title}
          />
        </ScrollView>
      ) : (
        <View style={styles.loading}>
          <Text style={{ color: colors.muted }}>{t('common:state.loadingWorkspace')}</Text>
        </View>
      )}
    </View>
  );
}

type RowProps = {
  readonly row: CategoryRow;
  readonly isLast: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly screen: {
    readonly editAriaLabel: (name: string) => string;
    readonly deleteAriaLabel: (name: string) => string;
  };
};

function Row({ row, isLast, onEdit, onDelete, screen }: RowProps) {
  const { colors } = useColor();

  return (
    <View
      style={[styles.row, !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
    >
      <View style={[styles.swatch, { backgroundColor: row.color }]} />
      <Text numberOfLines={1} style={[styles.rowName, { color: colors.foreground }]}>
        {row.name}
      </Text>
      <Pressable
        accessibilityLabel={screen.editAriaLabel(row.name)}
        accessibilityRole="button"
        onPress={onEdit}
        style={styles.iconButton}
      >
        <Pencil color={colors.muted} size={15} />
      </Pressable>
      <Pressable
        accessibilityLabel={screen.deleteAriaLabel(row.name)}
        accessibilityRole="button"
        onPress={onDelete}
        style={styles.iconButton}
      >
        <Trash2 color={colors.muted} size={15} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.md, padding: SPACING.gutter, paddingTop: 0 },
  count: { fontSize: 11 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.gutter,
    paddingBottom: SPACING.sm,
  },
  iconButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  row: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md },
  rowName: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowsCard: { overflow: 'hidden' },
  screen: { flex: 1 },
  swatch: { borderRadius: 4, height: 14, width: 14 },
  title: { flex: 1, fontSize: 20, fontWeight: '600' },
});
