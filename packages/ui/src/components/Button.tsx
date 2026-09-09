import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-sm whitespace-nowrap font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      tone: {
        primary: 'bg-accent text-white shadow-xs',
        secondary: 'border border-border bg-surface text-foreground shadow-xs hover:bg-surface-alt',
        ghost: 'text-foreground hover:bg-chip-bg',
        destruct: 'bg-neg text-white shadow-xs',
        soft: 'bg-accent-soft text-accent',
      },
      size: {
        sm: 'h-8 rounded-sm px-md text-sm',
        md: 'h-10 rounded-md px-lg text-base',
        lg: 'h-12 rounded-lg px-xl text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      tone: 'primary',
      size: 'md',
    },
  },
);

// The primary tone's ring — a simulated 1px border via a second box-shadow layer — is a
// component-level detail, not a token (design-system.md's Button row): it composes with the
// `shadow-xs` utility above rather than replacing it, so it's set inline instead of as a second
// Tailwind arbitrary-value class.
const PRIMARY_RING_STYLE = { boxShadow: '0 1px 2px rgba(0,0,0,.06), 0 0 0 1px var(--mfh-accent)' };

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    readonly icon?: LucideIcon;
    readonly iconRight?: LucideIcon;
  };

const iconSize: Record<NonNullable<ButtonProps['size']>, number> = { sm: 15, md: 17, lg: 19 };

export function Button({
  tone,
  size = 'md',
  fullWidth,
  icon: LeadingIcon,
  iconRight: TrailingIcon,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps): ReactNode {
  return (
    <button
      className={cn(buttonVariants({ tone, size, fullWidth }), className)}
      style={tone === 'primary' || tone === undefined ? PRIMARY_RING_STYLE : undefined}
      type={type}
      {...props}
    >
      {LeadingIcon && <LeadingIcon size={iconSize[size ?? 'md']} />}
      {children}
      {TrailingIcon && <TrailingIcon size={iconSize[size ?? 'md']} />}
    </button>
  );
}
