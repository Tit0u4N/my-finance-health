import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { categoricalPaletteHex } from '@repo/design-tokens/colors';
import { Database, Info, Lock, SlidersHorizontal, Tag } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { ACCENT, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { SectionGroup } from '@/ui/SectionGroup';
import { SettingsRow } from '@/ui/SettingsRow';
import type { SettingsSectionId } from './settingsSections';
import { useSettingsScreen } from './useSettingsScreen';

// Same source desktop's useSettingsLayout.ts picks its row colours from (`var(--mfh-accent)`,
// `var(--mfh-pos)`, `var(--mfh-categorical-5)`, `var(--mfh-categorical-3)`) — the accent token,
// the positive-state token, and two categorical swatches, not decorative hex literals.
function rowIcon(
  id: SettingsSectionId,
  pos: string,
): { readonly icon: typeof SlidersHorizontal; readonly color: string } {
  switch (id) {
    case 'preferences':
      return { color: ACCENT, icon: SlidersHorizontal };
    case 'categories':
      return { color: pos, icon: Tag };
    case 'data':
      return { color: categoricalPaletteHex[4] as string, icon: Database };
    case 'about':
      return { color: categoricalPaletteHex[2] as string, icon: Info };
    default:
      throw new Error(`unhandled settings section: ${id satisfies never}`);
  }
}

type SettingsScreenProps = {
  readonly version: string;
  readonly onOpenSection: (id: SettingsSectionId) => void;
};

/** The Settings tab's root menu (screens-invest-settings.jsx's `SettingsScreen`): a workspace
 * identity card, then "App" and "Support" row groups. */
export function SettingsScreen({ version, onOpenSection }: SettingsScreenProps) {
  const { colors } = useColor();
  const { t } = useTranslation();
  const screen = useSettingsScreen(version);

  if (!screen.ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.muted }}>{t('common:state.loadingWorkspace')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ScreenHeader subtitle={screen.subtitle} title={screen.title} />
      </View>

      <View style={styles.content}>
        <Card>
          <View style={styles.identityRow}>
            <View style={styles.mark}>
              <Text style={styles.markText}>M</Text>
            </View>
            <View style={styles.identityText}>
              <Text style={[styles.identityTitle, { color: colors.foreground }]}>{t('common:brand.name')}</Text>
              <Text style={[styles.identitySubtitle, { color: colors.muted }]}>{screen.identitySubtitle}</Text>
            </View>
            {screen.hasEncryptedStorage && (
              <Badge color={colors.pos} icon={Lock} size="sm">
                {screen.encryptedBadgeLabel}
              </Badge>
            )}
          </View>
        </Card>

        {screen.groups.map((group) => (
          <SectionGroup key={group.title} title={group.title}>
            {group.rows.map((row, index) => {
              const visuals = rowIcon(row.id, colors.pos);
              return (
                <SettingsRow
                  icon={visuals.icon}
                  iconColor={visuals.color}
                  key={row.id}
                  onPress={() => onOpenSection(row.id)}
                  showSeparator={index < group.rows.length - 1}
                  subtitle={row.sub}
                  title={row.label}
                />
              );
            })}
          </SectionGroup>
        ))}

        <Text style={[styles.footer, { color: colors.subtle }]}>{screen.footer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.md, padding: SPACING.gutter, paddingTop: 0 },
  footer: { fontSize: 11, paddingTop: SPACING.xs, textAlign: 'center' },
  header: { padding: SPACING.gutter, paddingBottom: SPACING.sm },
  identityRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm },
  identitySubtitle: { fontSize: 12.5, marginTop: 2 },
  identityText: { flex: 1, minWidth: 0 },
  identityTitle: { fontSize: 15, fontWeight: '600' },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
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
});
