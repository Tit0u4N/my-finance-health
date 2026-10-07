import type { AccountType } from '@repo/domain/entities/account';
import { Check, FilePlus, Folder } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';
import { AmountValue } from '@/ui/AmountValue';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Field } from '@/ui/Field';
import { ACCOUNT_TYPE_ICON } from '@/ui/visuals';
import { useOnboardingScreen } from './useOnboardingScreen';

const ACCOUNT_TYPES: readonly AccountType[] = ['Checking', 'Savings', 'Investment', 'Cash'];

type OnboardingScreenProps = {
  /** Called once the flow completes (step 2's "Enter the app") — the route file supplies the real
   * `router.back()`, see useOnboardingScreen.ts's docblock for why this stays a plain callback. */
  readonly onDone: () => void;
};

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const { colors } = useColor();
  const insets = useSafeAreaInsets();
  const onboarding = useOnboardingScreen(onDone);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stepper step={onboarding.step} />
      <ScrollView contentContainerStyle={styles.content}>
        {onboarding.step === 0 && <Step0 onboarding={onboarding} />}
        {onboarding.step === 1 && <Step1 onboarding={onboarding} />}
        {onboarding.step === 2 && <Step2 onboarding={onboarding} />}
      </ScrollView>
    </View>
  );
}

type Onboarding = ReturnType<typeof useOnboardingScreen>;

function Stepper({ step }: { readonly step: 0 | 1 | 2 }) {
  const { colors } = useColor();
  return (
    <View style={styles.stepper}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[styles.stepperSegment, { backgroundColor: index <= step ? colors.pos : colors.border }]}
        />
      ))}
    </View>
  );
}

function Step0({ onboarding }: { readonly onboarding: Onboarding }) {
  const { colors } = useColor();
  return (
    <>
      <Text style={[styles.title, { color: colors.foreground }]}>Your money, on your device.</Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        My Finance Health stores everything locally. No cloud, no account, no telemetry.
      </Text>
      <Pressable onPress={() => onboarding.onSelectWorkspaceOption('create')}>
        <Card
          style={[styles.optionCard, onboarding.selectedWorkspaceOption === 'create' && { borderColor: colors.pos }]}
        >
          <Avatar color={colors.pos} icon={FilePlus} />
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.foreground }]}>Create a new workspace</Text>
            <Text style={[styles.optionSubtitle, { color: colors.muted }]}>Start fresh — recommended</Text>
          </View>
          {onboarding.selectedWorkspaceOption === 'create' && <Check color={colors.pos} size={20} />}
        </Card>
      </Pressable>
      <Pressable onPress={() => onboarding.onSelectWorkspaceOption('open')}>
        <Card style={[styles.optionCard, onboarding.selectedWorkspaceOption === 'open' && { borderColor: colors.pos }]}>
          <Avatar color={colors.muted} icon={Folder} soft />
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.foreground }]}>Open an existing workspace</Text>
            <Text style={[styles.optionSubtitle, { color: colors.muted }]}>From a backup or another device</Text>
          </View>
          {onboarding.selectedWorkspaceOption === 'open' && <Check color={colors.pos} size={20} />}
        </Card>
      </Pressable>
      <Button
        disabled={onboarding.selectedWorkspaceOption === null}
        label="Continue"
        onPress={onboarding.onContinueFromStep0}
      />
    </>
  );
}

function Step1({ onboarding }: { readonly onboarding: Onboarding }) {
  const { colors } = useColor();
  return (
    <>
      <Text style={[styles.title, { color: colors.foreground }]}>Add your accounts</Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        At least one to get going. You can add more later.
      </Text>
      <Field
        label="Account name"
        onChangeText={(name) => onboarding.onChangeAccountDraft({ name })}
        placeholder="e.g. Everyday"
        value={onboarding.accountDraft.name}
      />
      <View style={styles.typeGrid}>
        {ACCOUNT_TYPES.map((type) => {
          const Icon = ACCOUNT_TYPE_ICON[type];
          const on = onboarding.accountDraft.type === type;
          return (
            <Pressable
              key={type}
              onPress={() => onboarding.onChangeAccountDraft({ type })}
              style={[
                styles.typeOption,
                {
                  backgroundColor: on ? colors.chipBg : colors.surfaceAlt,
                  borderColor: on ? colors.pos : colors.border,
                },
              ]}
            >
              <Icon color={on ? colors.pos : colors.foreground} size={16} />
              <Text style={{ color: on ? colors.pos : colors.foreground }}>{type}</Text>
            </Pressable>
          );
        })}
      </View>
      <Field
        keyboardType="decimal-pad"
        label="Initial balance"
        onChangeText={(balance) => onboarding.onChangeAccountDraft({ balance })}
        placeholder="0.00"
        value={onboarding.accountDraft.balance}
      />
      <Button
        disabled={onboarding.isAddAccountDisabled}
        label="Add account"
        onPress={onboarding.onAddAccount}
        tone="outline"
      />

      {onboarding.accounts.length > 0 && (
        <Card padding={0} style={styles.accountList}>
          {onboarding.accounts.map((account, index) => (
            <View
              key={account.id}
              style={[
                styles.accountRow,
                index < onboarding.accounts.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Avatar color={account.color} icon={account.icon} size={34} />
              <View style={styles.optionText}>
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>{account.name}</Text>
                <Text style={{ color: colors.muted, fontSize: FONT_SIZE.caption }}>{account.typeLabel}</Text>
              </View>
              <AmountValue value={account.balanceLabel} />
            </View>
          ))}
        </Card>
      )}

      <View style={styles.row}>
        <Button label="Back" onPress={onboarding.onBack} tone="outline" />
        <View style={styles.flex1}>
          <Button
            disabled={onboarding.accounts.length === 0}
            label="Continue"
            onPress={onboarding.onContinueFromStep1}
          />
        </View>
      </View>
    </>
  );
}

function Step2({ onboarding }: { readonly onboarding: Onboarding }) {
  const { colors } = useColor();
  const income = onboarding.categories.filter((category) => category.kind === 'income');
  const expense = onboarding.categories.filter((category) => category.kind === 'expense');

  const column = (title: string, categories: typeof income) => (
    <View style={styles.categoryColumn}>
      <Text style={{ color: colors.foreground, fontWeight: '600' }}>{title}</Text>
      {categories.map((category) => (
        <Pressable
          key={category.id}
          onPress={() => onboarding.onToggleCategory(category.id)}
          style={[styles.categoryRow, { opacity: category.enabled ? 1 : 0.55 }]}
        >
          <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
          <Text style={{ color: colors.foreground, flex: 1, fontSize: FONT_SIZE.bodySm }}>{category.name}</Text>
          <View
            style={[
              styles.categoryCheck,
              {
                backgroundColor: category.enabled ? colors.pos : 'transparent',
                borderColor: category.enabled ? colors.pos : colors.border,
              },
            ]}
          >
            {category.enabled && <Check color="#FFFFFF" size={12} />}
          </View>
        </Pressable>
      ))}
    </View>
  );

  return (
    <>
      <Text style={[styles.title, { color: colors.foreground }]}>Pick your categories</Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        Tap to enable. Tweak the list anytime in Settings.
      </Text>
      <View style={styles.row}>
        {column('Income', income)}
        {column('Expenses', expense)}
      </View>
      <View style={styles.row}>
        <Button label="Back" onPress={onboarding.onBack} tone="outline" />
        <View style={styles.flex1}>
          <Button label="Enter the app" onPress={onboarding.onFinish} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  accountList: { overflow: 'hidden' },
  accountRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md },
  categoryCheck: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  categoryColumn: { flex: 1, gap: SPACING.sm },
  categoryDot: { borderRadius: 99, flexShrink: 0, height: 10, width: 10 },
  categoryRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm },
  content: { gap: SPACING.md, padding: SPACING.gutter },
  description: { fontSize: FONT_SIZE.body, lineHeight: 20 },
  flex1: { flex: 1 },
  optionCard: { alignItems: 'center', flexDirection: 'row', gap: SPACING.md },
  optionSubtitle: { fontSize: FONT_SIZE.caption, marginTop: 2 },
  optionText: { flex: 1, minWidth: 0 },
  optionTitle: { fontSize: FONT_SIZE.body, fontWeight: '600' },
  row: { flexDirection: 'row', gap: SPACING.sm },
  screen: { flex: 1 },
  stepper: { flexDirection: 'row', gap: 6, padding: SPACING.gutter, paddingBottom: 0 },
  stepperSegment: { borderRadius: 99, flex: 1, height: 3 },
  title: { fontSize: FONT_SIZE.heading, fontWeight: '600' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeOption: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACING.xs,
    minWidth: '45%',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
});
