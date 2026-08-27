import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      tone: {
        primary: 'bg-primary text-primary-foreground hover:opacity-90',
        outline: 'border border-border bg-transparent text-foreground hover:bg-muted',
      },
      size: {
        sm: 'h-9 rounded-sm px-md text-sm',
        md: 'h-11 rounded-md px-lg text-base',
      },
    },
    defaultVariants: {
      tone: 'primary',
      size: 'md',
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ tone, size, className, type = 'button', ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ tone, size }), className)} type={type} {...props} />;
}
