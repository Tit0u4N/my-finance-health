// @repo/platform-tauri — level 1.
// LocalizationService (@repo/platform/services/localization) on the WebView's own `navigator`.
// The DOM `Navigator` type is spelled out locally rather than named — see random.ts's docblock.

import type { LocalizationService } from '@repo/platform/services/localization';

export type NavigatorLike = {
  readonly language: string;
};

export function createNavigatorLocalization(navigator: NavigatorLike): LocalizationService {
  return {
    locale: () => navigator.language,
  };
}
