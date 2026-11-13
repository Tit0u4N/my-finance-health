import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { ArrowLeft, Database, Lock, Repeat, ScanFace, Timer, Upload } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { EmptyState } from '@/ui/EmptyState';
import { RoundButton } from '@/ui/RoundButton';
import { SectionGroup } from '@/ui/SectionGroup';
import { SettingsRow } from '@/ui/SettingsRow';
import { Switch } from '@/ui/Switch';
import { useDataScreen } from './useDataScreen';

type DataScreenProps = {
  readonly onBack: () => void;
};

/** Settings → Data — mobile's counterpart of the desktop-only Database screen. Real workspace
 * facts regardless of file capability, plus the one real affordance carried over from the old
 * SettingsPlaceholder route (a link into onboarding); file actions (export, lock, switch
 * workspace) only appear for a real local workspace on a platform that can write files. */
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

          {screen.security && (
            <SectionGroup title={screen.security.title}>
              {screen.security.biometric && (
                <SettingsRow
                  icon={ScanFace}
                  iconColor={colors.pos}
                  showSeparator
                  subtitle={screen.security.biometric.description}
                  title={screen.security.biometric.title}
                  trailing={
                    <Switch
                      accessibilityLabel={screen.security.biometric.title}
                      disabled={!screen.security.biometric.isEnrolled || screen.security.biometric.isUpdating}
                      onValueChange={(next) => {
                        if (!next) {
                          screen.security?.biometric?.onTurnOff();
                        }
                      }}
                      value={screen.security.biometric.isEnrolled}
                    />
                  }
                />
              )}
              <SettingsRow
                icon={Timer}
                iconColor={colors.muted}
                subtitle={screen.security.autoLock.description}
                title={screen.security.autoLock.title}
                trailing={
                  <Switch
                    accessibilityLabel={screen.security.autoLock.title}
                    onValueChange={screen.security.autoLock.onChange}
                    value={screen.security.autoLock.value}
                  />
                }
              />
            </SectionGroup>
          )}
          {screen.security?.biometric?.error && (
            <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.neg }]}>
              {screen.security.biometric.error}
            </Text>
          )}

          {screen.fileActions && (
            <SectionGroup title={t('settings:database.transfer.title')}>
              <SettingsRow
                icon={Upload}
                iconColor={colors.pos}
                onPress={screen.fileActions.onExport}
                showSeparator
                subtitle={t('settings:database.transfer.exportSubtitle')}
                title={t('settings:database.transfer.exportTitle')}
              />
              <SettingsRow
                icon={Lock}
                iconColor={colors.muted}
                onPress={screen.fileActions.onLock}
                showSeparator
                title={t('settings:database.transfer.lock')}
              />
              <SettingsRow
                icon={Repeat}
                iconColor={colors.muted}
                onPress={screen.fileActions.onSwitchWorkspace}
                subtitle={t('settings:database.transfer.switchSubtitle')}
                title={t('settings:database.transfer.switchTitle')}
              />
            </SectionGroup>
          )}
          {screen.fileActions?.exportStatus && (
            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.status,
                { color: screen.fileActions.exportStatus.tone === 'success' ? colors.pos : colors.neg },
              ]}
            >
              {screen.fileActions.exportStatus.text}
            </Text>
          )}

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
  status: { fontSize: 13, paddingHorizontal: SPACING.xs },
  title: { flex: 1, fontSize: 20, fontWeight: '600' },
});
