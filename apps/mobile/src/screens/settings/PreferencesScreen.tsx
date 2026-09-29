// View for Settings → Preferences — JSX and native composition only. `useTranslation` is allowed
// here for static copy (the theme/language OptionGrid arrays carry lucide-react-native icons,
// which the ViewModel has no business resolving — the same split desktop's own PreferencesScreen
// already draws).

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { ArrowLeft, Coins, Globe, Languages, Moon, Sun } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { EmptyState } from '@/ui/EmptyState';
import { Field } from '@/ui/Field';
import { OptionGrid } from '@/ui/OptionGrid';
import { RoundButton } from '@/ui/RoundButton';
import { SectionGroup } from '@/ui/SectionGroup';
import { usePreferencesScreen } from './usePreferencesScreen';

type PreferencesScreenProps = {
  readonly onBack: () => void;
};

export function PreferencesScreen({ onBack }: PreferencesScreenProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const screen = usePreferencesScreen();

  const themeOptions = [
    { icon: Sun, label: t('settings:preferences.theme.options.light'), value: 'light' as const },
    { icon: Moon, label: t('settings:preferences.theme.options.dark'), value: 'dark' as const },
    { icon: Globe, label: t('settings:preferences.theme.options.system'), value: 'system' as const },
  ];

  // "English"/"Français" are endonyms — always literal, never run through t(), regardless of the
  // active UI language (CLAUDE.md's "what to never translate").
  const languageOptions = [
    { icon: Languages, label: t('settings:preferences.language.options.system'), value: 'system' as const },
    { label: 'English', value: 'en' as const },
    { label: 'Français', value: 'fr' as const },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <RoundButton accessibilityLabel={t('common:action.back')} icon={ArrowLeft} onPress={onBack} variant="ghost" />
        <Text style={[styles.title, { color: colors.foreground }]}>{t('settings:nav.preferences.label')}</Text>
      </View>

      {screen.ready ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SectionGroup title={t('settings:preferences.appearancePanel.title')}>
            <View style={styles.panelRow}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                {t('settings:preferences.theme.label')}
              </Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>
                {t('settings:preferences.theme.description')}
              </Text>
              <OptionGrid
                accessibilityLabel={t('settings:preferences.theme.label')}
                columns={3}
                onChange={screen.onThemeModeChange}
                options={themeOptions}
                value={screen.themeMode}
              />
            </View>
          </SectionGroup>

          <SectionGroup title={t('settings:preferences.regionalPanel.title')}>
            <View style={styles.panelRow}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                {t('settings:preferences.language.label')}
              </Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>
                {t('settings:preferences.language.description')}
              </Text>
              <OptionGrid
                accessibilityLabel={t('settings:preferences.language.label')}
                columns={3}
                onChange={screen.onLanguageChange}
                options={languageOptions}
                value={screen.languageOption}
              />
            </View>

            <View
              style={[styles.panelRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                {t('settings:preferences.baseCurrency.label')}
              </Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>
                {t('settings:preferences.baseCurrency.description')}
              </Text>
              <OptionGrid
                accessibilityLabel={t('settings:preferences.baseCurrency.label')}
                columns={3}
                onChange={screen.onBaseCurrencyChange}
                options={screen.baseCurrencyOptions.map((option) => ({
                  glyph: option.glyph,
                  label: option.label,
                  value: option.value,
                }))}
                value={screen.baseCurrency}
              />
            </View>

            <View
              style={[styles.panelRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                {t('settings:preferences.exchangeRates.label')}
              </Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>
                {t('settings:preferences.exchangeRates.description', { baseCurrency: screen.baseCurrency })}
              </Text>
              {screen.rates.length === 0 ? (
                <EmptyState
                  icon={Coins}
                  subtitle={t('settings:preferences.exchangeRates.emptySubtitle')}
                  title={t('settings:preferences.exchangeRates.emptyTitle')}
                />
              ) : (
                <View style={styles.rateList}>
                  {screen.rates.map((rate) => (
                    <View key={rate.currency}>
                      <Field
                        keyboardType="decimal-pad"
                        label={rate.label}
                        onBlur={rate.onCommit}
                        onChangeText={rate.onValueChange}
                        value={rate.value}
                      />
                      {rate.isMissing && (
                        <Text style={[styles.rateError, { color: colors.neg }]}>
                          {t('settings:preferences.exchangeRates.missingRateError')}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </SectionGroup>
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
  panelRow: { gap: SPACING.sm, padding: SPACING.md },
  rateError: { fontSize: FONT_SIZE.caption, marginTop: 4 },
  rateList: { gap: SPACING.sm },
  rowDescription: { fontSize: FONT_SIZE.caption },
  rowLabel: { fontSize: FONT_SIZE.body, fontWeight: '600' },
  screen: { flex: 1 },
  title: { fontSize: FONT_SIZE.heading, fontWeight: '600' },
});
