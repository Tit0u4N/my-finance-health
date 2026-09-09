import { contentLayoutTokens } from '@repo/design-tokens/layout';
import type { ReactNode } from 'react';

export type ContentProps = {
  readonly children: ReactNode;
  /** The rare "wide" variant (design-system.md §8) — a wider max-width for content-heavy screens. */
  readonly wide?: boolean;
};

/** Page body wrapper — max-width + padding + vertical stack gap, every screen (ui-inventory.md §2). */
export function Content({ children, wide = false }: ContentProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div
        className="mx-auto flex flex-col"
        style={{
          maxWidth: wide ? contentLayoutTokens.maxWidthWide : contentLayoutTokens.maxWidth,
          paddingLeft: contentLayoutTokens.paddingX,
          paddingRight: contentLayoutTokens.paddingX,
          paddingTop: contentLayoutTokens.paddingTop,
          paddingBottom: contentLayoutTokens.paddingBottom,
          gap: contentLayoutTokens.gap,
        }}
      >
        {children}
      </div>
    </div>
  );
}
