import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { Link } from 'expo-router';
import { ArrowLeft, Database, FilePlus } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { EmptyState } from '@/ui/EmptyState';
import { RoundButton } from '@/ui/RoundButton';
import { SectionGroup } from '@/ui/SectionGroup';
import { SettingsRow } from '@/ui/SettingsRow';
import { useDataScreen } from './useDataScreen';

type DataScreenProps = {
  readonly onBack: () => void;
};

/** Settings → Data — mobile's counterpart of the desktop-only Database screen. Real workspace
 * facts regardless of file capability, plus the one real affordance carried over from the old
 * SettingsPlaceholder route (a link into onboarding); file actions (switch file, backup, export)
 * only ever appear once `platform.capabilities.canWriteFile` is honestly true. */
export function DataScreen({ onBack }: DataScreenProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const screen = useDataScreen();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <RoundButton accessibilityLabel={t('common:action.back')} icon={ArrowLeft} onPress={onBack} variant="ghost" />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {screen.ready ? screen.title : t('settings:nav.data.label')}
        </Text>
      </View>

      {screen.ready ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SectionGroup title={screen.workspacePanelTitle}>
            {screen.metadata.map((row, index) => (
              <View
                key={row.label}
                style={[
                  styles.metadataRow,
                  index < screen.metadata.length - 1 && {
                    borderBottomColor: colors.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <Text style={[styles.metadataLabel, { color: colors.muted }]}>{row.label}</Text>
                <Text style={[styles.metadataValue, { color: colors.foreground }]}>{row.value}</Text>
              </View>
            ))}
          </SectionGroup>

          <Link asChild href="/onboarding">
            <SettingsRow icon={FilePlus} iconColor={colors.pos} title={screen.newWorkspaceLabel} />
          </Link>

          {!screen.isAvailable && (
            <EmptyState icon={Database} subtitle={screen.emptySubtitle} title={screen.emptyTitle} />
          )}
        </ScrollView>
      ) : (
        <View style={styles.loading}>
          <Text style={{ color: colors.muted }}>{t('common:state.loadingWorkspace')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.md, padding: SPACING.gutter, paddingBottom: SPACING.section, paddingTop: 0 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.gutter,
    paddingBottom: SPACING.sm,
  },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  metadataLabel: { fontSize: 13 },
  metadataRow: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md },
  metadataValue: { fontSize: 13, fontWeight: '600' },
  screen: { flex: 1 },
  title: { flex: 1, fontSize: 20, fontWeight: '600' },
});
