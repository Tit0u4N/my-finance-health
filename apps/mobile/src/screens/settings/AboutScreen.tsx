// View for Settings → About (screens.md: "Static app info… hardcoded strings"). No ViewModel —
// zero data-fetching hooks, module-level constants; the same reasoning
// packages/routes/src/settings/AboutScreen.tsx already documents for its own zero-hook View.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ACCENT, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Badge } from '@/ui/Badge';
import { RoundButton } from '@/ui/RoundButton';
import { SectionGroup } from '@/ui/SectionGroup';

const VERSION = '1.2.0';
const FACT_KEYS = ['storage', 'sync', 'telemetry'] as const;

type AboutScreenProps = {
  readonly onBack: () => void;
};

export function AboutScreen({ onBack }: AboutScreenProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  // `hasEncryptedSqlDriver` is honestly false on mobile today (@repo/platform-expo is a
  // placeholder — apps/mobile/src/root/useAppRoot.ts): the badge follows the capability instead
  // of claiming an encryption this build doesn't have. A synchronous platform read, not data
  // fetching, so this stays the same zero-ViewModel View desktop's own AboutScreen.tsx is.
  const hasEncryptedStorage = usePlatform().capabilities.hasEncryptedSqlDriver;

  const facts = FACT_KEYS.map((key) => ({
    label: t(`settings:about.facts.${key}.label`),
    value: t(`settings:about.facts.${key}.value`),
  }));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <RoundButton accessibilityLabel={t('common:action.back')} icon={ArrowLeft} onPress={onBack} variant="ghost" />
        <Text style={[styles.title, { color: colors.foreground }]}>{t('settings:nav.about.label')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identityRow}>
          <View style={styles.mark}>
            <Text style={styles.markText}>M</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={[styles.identityTitle, { color: colors.foreground }]}>{t('common:brand.name')}</Text>
            <Text style={[styles.identitySubtitle, { color: colors.muted }]}>
              {t('settings:about.version', { version: VERSION })}
            </Text>
          </View>
          {hasEncryptedStorage && (
            <Badge color={colors.pos} icon={Lock}>
              {t('settings:about.encryptedAtRest')}
            </Badge>
          )}
        </View>

        <SectionGroup title={t('settings:about.panelSubtitleMobile')}>
          {facts.map((fact, index) => (
            <View
              key={fact.label}
              style={[
                styles.factRow,
                index < facts.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Text style={[styles.factLabel, { color: colors.muted }]}>{fact.label}</Text>
              <Text style={[styles.factValue, { color: colors.foreground }]}>{fact.value}</Text>
            </View>
          ))}
        </SectionGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.md, padding: SPACING.gutter, paddingBottom: SPACING.section, paddingTop: 0 },
  factLabel: { fontSize: 13 },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md },
  factValue: { fontSize: 13, fontWeight: '600' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.gutter,
    paddingBottom: SPACING.sm,
  },
  identityRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm },
  identitySubtitle: { fontSize: 12.5, marginTop: 2 },
  identityText: { flex: 1, minWidth: 0 },
  identityTitle: { fontSize: 15, fontWeight: '600' },
  mark: {
    alignItems: 'center',
    backgroundColor: ACCENT,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  markText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  screen: { flex: 1 },
  title: { flex: 1, fontSize: 20, fontWeight: '600' },
});
