import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-hover dark:text-bg',
        variant === 'secondary' && 'border border-border bg-surface text-text hover:bg-bg',
        variant === 'ghost' && 'text-text hover:bg-surface',
        className,
      )}
      {...props}
    />
  );
}
