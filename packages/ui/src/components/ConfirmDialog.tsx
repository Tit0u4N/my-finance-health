import { AlertDialog as BaseAlertDialog } from '@base-ui-components/react/alert-dialog';
import { Button } from './Button';

export type ConfirmDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly isPending?: boolean;
};

/** Destructive-action confirm (category delete, and every other "cannot be undone" prompt this
 * app grows) — base-ui's `AlertDialog`, not `Dialog`: it never dismisses on a backdrop click or
 * outside interaction, only on an explicit choice (ui-inventory.md §1's `Dialog` row lists only
 * the three creation modals; this is the one case that needs the stricter variant). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending = false,
}: ConfirmDialogProps) {
  return (
    <BaseAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Backdrop className="fixed inset-0 z-40 bg-overlay" />
        <BaseAlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-100 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-lg outline-none">
          <BaseAlertDialog.Title className="text-foreground text-heading-sm">{title}</BaseAlertDialog.Title>
          <BaseAlertDialog.Description className="mt-2 text-body-sm text-muted leading-relaxed">
            {description}
          </BaseAlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            {/* A plain onClick, not AlertDialog.Close's `render` merge — Button isn't forwardRef'd,
             * and Close's only job here (closing without confirming) needs no DOM ref from base-ui. */}
            <Button tone="secondary" size="sm" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button tone="destruct" size="sm" onClick={onConfirm} disabled={isPending}>
              {confirmLabel}
            </Button>
          </div>
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  );
}
