import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { useColor } from '@/theme/useColor';

// `+not-found` is imposed by Expo Router, which also requires a default export from every route file.
export default function NotFoundRoute() {
  const { colors } = useColor();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>This screen does not exist.</Text>
        <Link href="/" style={[styles.link, { color: colors.primary }]}>
          Back to the landing page
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
    justifyContent: 'center',
    padding: SPACING.gutter,
  },
  link: {
    fontSize: FONT_SIZE.base,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
});
