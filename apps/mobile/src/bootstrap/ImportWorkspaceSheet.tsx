import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import type { Platform } from '@repo/platform/platform';
import { Database, FolderOpen } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';
import { SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { Button } from '@/ui/Button';
import { SectionGroup } from '@/ui/SectionGroup';
import { SettingsRow } from '@/ui/SettingsRow';
import { Sheet } from '@/ui/Sheet';
import { useImportWorkspace } from './useImportWorkspace';

type ImportWorkspaceSheetProps = {
  readonly isOpen: boolean;
  readonly platform: Platform;
  readonly onClose: () => void;
  readonly onImported: (ref: WorkspaceRef) => void;
};

export function ImportWorkspaceSheet({ isOpen, platform, onClose, onImported }: ImportWorkspaceSheetProps) {
  const { colors } = useColor();
  const importer = useImportWorkspace({ platform, onImported });

  return (
    <Sheet closeLabel="Close" isOpen={isOpen} onClose={onClose} title="Import a workspace">
      <Text style={[styles.hint, { color: colors.muted }]}>
        Pick the folder holding an exported workspace — in iCloud Drive, Google Drive or anywhere in Files. A copy is
        made on this device; the original is left untouched.
      </Text>
      <Button
        disabled={importer.isBusy}
        icon={FolderOpen}
        label="Choose folder…"
        onPress={() => void importer.onPickFolder()}
        tone="outline"
      />
      {importer.message !== undefined && (
        <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.neg }]}>
          {importer.message}
        </Text>
      )}
      {importer.candidates.length > 0 && (
        <SectionGroup title="Found">
          {importer.candidates.map((candidate, index) => (
            <SettingsRow
              icon={Database}
              iconColor={colors.pos}
              key={candidate.path}
              onPress={() => void importer.onSelect(candidate)}
              showSeparator={index < importer.candidates.length - 1}
              title={candidate.label}
            />
          ))}
        </SectionGroup>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, lineHeight: 18, marginBottom: SPACING.xs },
  message: { fontSize: 13 },
});
