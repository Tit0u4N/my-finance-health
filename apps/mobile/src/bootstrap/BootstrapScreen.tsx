// Bootstrap stage UI (start-roadmap.md §9): choose / create / import a workspace, then unlock it.
// Runs with platform + translations context only — no repositories exist yet. Mobile's counterpart
// of apps/desktop's BootstrapScreen.tsx, native rather than DOM, so none of its components are
// shared (start-roadmap.md §2, principle 2).

import type { UseWorkspaceBootstrapResult } from '@repo/app-core/bootstrap/useWorkspaceBootstrap';
import type { Platform } from '@repo/platform/platform';
import { AlertTriangle, Cloud, Database, FolderInput, Plus } from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform as NativePlatform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LocalBootstrapProgress } from '@/root/useLocalAppRoot';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { SectionGroup } from '@/ui/SectionGroup';
import { SettingsRow } from '@/ui/SettingsRow';
import { CreateWorkspaceSheet } from './CreateWorkspaceSheet';
import { ImportWorkspaceSheet } from './ImportWorkspaceSheet';
import { UnlockWorkspaceForm } from './UnlockWorkspaceForm';
import { type BootstrapView, useBootstrapScreen } from './useBootstrapScreen';

type BootstrapScreenProps = {
  readonly bootstrap: UseWorkspaceBootstrapResult;
  readonly platform: Platform;
  /** Cosmetic only — labels the spinner while `unlock`/`create` is in flight. */
  readonly progress: LocalBootstrapProgress;
};

export function BootstrapScreen({ bootstrap, platform, progress }: BootstrapScreenProps) {
  const { colors } = useColor();
  const insets = useSafeAreaInsets();
  const screen = useBootstrapScreen(bootstrap, progress, platform);

  return (
    <KeyboardAvoidingView
      behavior={NativePlatform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {renderBody(screen.view, screen)}
      </ScrollView>
      <CreateWorkspaceSheet
        isOpen={screen.isCreateOpen}
        onClose={screen.onCloseSheets}
        onCreate={screen.onCreate}
        platform={platform}
      />
      <ImportWorkspaceSheet
        isOpen={screen.isImportOpen}
        onClose={screen.onCloseSheets}
        onImported={screen.onImported}
        platform={platform}
      />
    </KeyboardAvoidingView>
  );
}

function renderBody(view: BootstrapView, screen: ReturnType<typeof useBootstrapScreen>) {
  switch (view.kind) {
    case 'loading':
      return <Progress label={view.label} />;
    case 'picker':
      return (
        <WorkspaceList
          onCreate={screen.onStartCreate}
          onImport={screen.onStartImport}
          onOpen={screen.onOpen}
          recent={view.recent}
          synced={view.synced}
        />
      );
    case 'unlock':
      return (
        <UnlockWorkspaceForm
          onChooseAnother={screen.onChooseAnother}
          onUnlock={screen.onUnlock}
          workspaceRef={view.workspaceRef}
        />
      );
    case 'error':
      return (
        <View style={styles.error}>
          <EmptyState icon={AlertTriangle} title={view.message} />
          {screen.onRetry && <Button label="Try again" onPress={screen.onRetry} tone="outline" />}
          <Button label="Choose another workspace" onPress={screen.onChooseAnother} tone="outline" />
        </View>
      );
    default:
      return view satisfies never;
  }
}

function Progress({ label }: { readonly label: string }) {
  const { colors } = useColor();
  return (
    <View accessibilityLiveRegion="polite" style={styles.progress}>
      <ActivityIndicator color={colors.muted} />
      <Text style={{ color: colors.muted }}>{label}</Text>
    </View>
  );
}

type WorkspaceListProps = {
  readonly recent: BootstrapViewPicker['recent'];
  readonly synced: BootstrapViewPicker['synced'];
  readonly onOpen: ReturnType<typeof useBootstrapScreen>['onOpen'];
  readonly onCreate: () => void;
  readonly onImport: () => void;
};
type BootstrapViewPicker = Extract<BootstrapView, { kind: 'picker' }>;

function WorkspaceList({ recent, synced, onOpen, onCreate, onImport }: WorkspaceListProps) {
  const { colors } = useColor();

  return (
    <View style={styles.list}>
      <ScreenHeader subtitle="Your data stays encrypted, on this device or in your iCloud." title="my finance health" />
      {recent.length > 0 && (
        <SectionGroup title="Workspaces">
          {recent.map((workspace, index) => (
            <SettingsRow
              icon={Database}
              iconColor={colors.pos}
              key={workspace.id}
              onPress={() => onOpen(workspace)}
              showSeparator={index < recent.length - 1}
              title={workspace.label}
            />
          ))}
        </SectionGroup>
      )}
      {synced.length > 0 && (
        <SectionGroup title="In iCloud Drive">
          {synced.map((workspace, index) => (
            <SettingsRow
              icon={Cloud}
              iconColor={colors.pos}
              key={workspace.id}
              onPress={() => onOpen(workspace)}
              showSeparator={index < synced.length - 1}
              title={workspace.label}
            />
          ))}
        </SectionGroup>
      )}
      <View style={styles.actions}>
        <Button icon={Plus} label="Create a workspace" onPress={onCreate} />
        <Button icon={FolderInput} label="Import a workspace" onPress={onImport} tone="outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: SPACING.sm },
  content: { flexGrow: 1, justifyContent: 'center', padding: SPACING.gutter },
  error: { gap: SPACING.sm },
  list: { gap: SPACING.lg },
  progress: { alignItems: 'center', gap: SPACING.md, justifyContent: 'center', padding: SPACING.xl },
  screen: { flex: 1 },
});
