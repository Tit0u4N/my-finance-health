import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { Tabs } from 'expo-router';
import { ArrowLeftRight, Home, Settings, TrendingUp, Wallet } from 'lucide-react-native';
import { ACCENT } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

// `_layout` is imposed by Expo Router, which also requires a default export from every route file.
export default function TabsLayout() {
  const { colors } = useColor();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('common:nav.home'), tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: t('common:nav.accounts'),
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('common:nav.activity'),
          tabBarIcon: ({ color, size }) => <ArrowLeftRight color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          title: t('common:nav.invest'),
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('common:nav.settings'),
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
