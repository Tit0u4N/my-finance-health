import { Tooltip as BaseTooltip } from '@base-ui-components/react/tooltip';
import type { ReactElement } from 'react';

export type TooltipProps = {
  readonly label: string;
  /** A single element — merged with the trigger's own props via base-ui's `render`, so it keeps
   * being the real DOM node (e.g. the sidebar's own `<button>`), not wrapped in an extra one. */
  readonly children: ReactElement<Record<string, unknown>>;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
};

/** Accessible hover/focus label — ui-inventory.md §1: "Sidebar collapsed-mode item labels…
 * base-ui fixes this outright" in place of the mock's `title=` attribute, which the same row
 * calls out as "worse for keyboard/touch". */
export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={8} className="z-70">
          <BaseTooltip.Popup className="rounded-sm border border-border bg-elevated px-2.5 py-1.5 text-body-sm text-foreground shadow-md">
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
