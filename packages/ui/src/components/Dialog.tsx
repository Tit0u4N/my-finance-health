import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export type DialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  /** Pixel width — the mock sizes each modal individually (`New account` is 560), not off a fixed scale. */
  readonly width?: number;
  readonly children: ReactNode;
  /** @repo/ui may not import @repo/i18n (start-roadmap.md §6) — the close button's accessible
   * name comes from the caller in @repo/routes. */
  readonly closeLabel: string;
};

/** Creation/edit modal — ui-inventory.md §1 ("New transaction/account/recurring modals", extended
 * to category create/edit here). base-ui `Dialog` gives focus trap, scroll lock and `Esc`/backdrop
 * dismissal for free — the mock hand-rolls all three. */
export function Dialog({
  open,
  onOpenChange,
  title,
  subtitle,
  actions,
  width = 480,
  children,
  closeLabel,
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-overlay" />
        <BaseDialog.Popup
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-surface shadow-lg outline-none"
          style={{ width }}
        >
          <div className="flex items-start justify-between gap-4 border-border border-b px-5 py-4">
            <div className="min-w-0">
              <BaseDialog.Title className="text-foreground text-heading-sm">{title}</BaseDialog.Title>
              {subtitle && (
                <BaseDialog.Description className="mt-1 text-body-sm text-muted">{subtitle}</BaseDialog.Description>
              )}
            </div>
            <BaseDialog.Close
              aria-label={closeLabel}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm text-subtle hover:bg-chip-bg"
            >
              <X size={16} />
            </BaseDialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {actions && (
            <div className="flex justify-end gap-2 border-border border-t bg-surface-alt px-5 py-4">{actions}</div>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
