import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

type AvatarProps = {
  readonly icon: LucideIcon;
  readonly color: string;
  readonly size?: number;
  /** Tinted disc (icon in `color` on a `color`-at-12%-opacity background) instead of a solid one
   * with a white icon — the mockup's `soft` prop (ui.jsx's `Avatar`). */
  readonly soft?: boolean;
};

const SOFT_BACKGROUND_ALPHA = '1F'; // ~12% alpha hex suffix, matches ui.jsx's `${color}1F`.

/** Icon disc used for account/category rows across every screen (ui-inventory-mobile.md §1). */
export function Avatar({ icon: Icon, color, size = 36, soft = false }: AvatarProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: soft ? `${color}${SOFT_BACKGROUND_ALPHA}` : color,
          borderRadius: size / 3,
          height: size,
          width: size,
        },
      ]}
    >
      <Icon color={soft ? color : '#FFFFFF'} size={Math.round(size * 0.5)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
  },
});
