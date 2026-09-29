import { StatusBar } from 'expo-status-bar';
import { useColor } from './useColor';

/** `expo-status-bar`'s own `style="auto"` reads the OS scheme, which is wrong once `themeMode`
 * pins a scheme the OS disagrees with — this follows the resolved `scheme` instead. Logic-free,
 * so it stays a single file per CLAUDE.md's MVVM exception for primitives. */
export function ThemedStatusBar() {
  const { scheme } = useColor();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}
