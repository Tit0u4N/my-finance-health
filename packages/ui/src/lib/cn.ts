import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges conditional class lists and resolves conflicting Tailwind utilities in favour of the last one. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
