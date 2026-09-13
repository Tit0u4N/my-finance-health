import { Field } from '@base-ui-components/react/field';
import type { LucideIcon } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { inputControlClassName } from './inputControlClassName';

// `style` is omitted too: React's InputHTMLAttributes types it `CSSProperties | undefined`
// explicitly, which exactOptionalPropertyTypes then rejects against base-ui's `style?: CSSProperties`
// on FieldControlProps — no caller here needs an inline style override on this primitive.
export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'style'> & {
  readonly label?: string;
  readonly icon?: LucideIcon;
  readonly suffix?: ReactNode;
  readonly error?: string;
};

/** Text field — ui-inventory.md §1. base-ui `Field` wires label↔control association and error
 * announcement for free; `invalid`/`Field.Error` are driven externally by `error` rather than
 * base-ui's native-validity model, since every consumer here is a fully controlled form. */
export function Input({ label, icon: Icon, suffix, error, className, id, ...props }: InputProps) {
  return (
    <Field.Root invalid={Boolean(error)} className="flex flex-col gap-1.5">
      {label && <Field.Label className="text-label text-muted">{label}</Field.Label>}
      <div className="relative flex items-center">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3 text-subtle" />}
        <Field.Control
          id={id}
          className={inputControlClassName({
            hasLeadingIcon: Boolean(Icon),
            hasTrailingContent: Boolean(suffix),
            className,
          })}
          {...props}
        />
        {suffix && <div className="absolute right-3 flex items-center text-subtle">{suffix}</div>}
      </div>
      {error && (
        <Field.Error match className="text-body-sm text-neg">
          {error}
        </Field.Error>
      )}
    </Field.Root>
  );
}
