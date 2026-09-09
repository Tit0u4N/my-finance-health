import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';
import { Check } from 'lucide-react';
import { cn } from '../lib/cn';

export type CheckboxProps = {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly className?: string;
  readonly id?: string;
  readonly 'aria-label'?: string;
};

export function Checkbox({ checked, onCheckedChange, className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm border border-border-strong text-white transition-colors',
        'data-[checked]:border-accent data-[checked]:bg-accent',
        'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        className,
      )}
      {...props}
    >
      <BaseCheckbox.Indicator className="flex" keepMounted={false}>
        <Check size={11} strokeWidth={3} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
