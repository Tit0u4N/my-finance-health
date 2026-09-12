import type { TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { cn } from '../lib/cn';

// A plain `<label>` + `<textarea>` pair, not base-ui's Field: Field.Control's `render` prop can
// swap in a `<textarea>`, but its typed props stay pinned to `<input>` (FieldControlProps extends
// BaseUIComponentProps<'input', ...>) — `onChange`/`value`/`rows` would all need casting away from
// their real textarea types. A multi-line note field has no validity/dirty/touched state to share
// with a Field.Root, so the plain pair is the simpler, honestly-typed option here.
export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> & {
  readonly label?: string;
  readonly error?: string;
};

/** Multi-line text field — Investment detail's plain-text note panel (ui-inventory.md, resolving
 * open-questions.md #15b by dropping rich text from v1). */
export function Textarea({ label, error, className, id, rows = 4, ...props }: TextareaProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={controlId} className="text-label text-muted">
          {label}
        </label>
      )}
      <textarea
        id={controlId}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn(
          'w-full resize-y rounded-md border border-border bg-surface-alt px-3.5 py-2.5 text-body text-foreground outline-none transition-colors',
          'placeholder:text-subtle',
          'focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent/30',
          'aria-invalid:border-neg',
          className,
        )}
        {...props}
      />
      {error && <span className="text-body-sm text-neg">{error}</span>}
    </div>
  );
}
