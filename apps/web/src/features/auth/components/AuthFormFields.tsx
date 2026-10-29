import type { InputHTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextField({ label, error, id, className, ...props }: FieldProps) {
  const fieldId = id ?? props.name;
  const errorId = error && fieldId ? `${fieldId}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={fieldId}
        className={cn(
          'w-full rounded-md border border-border bg-surface px-3 py-2 text-text shadow-sm placeholder:text-muted',
          error && 'border-danger',
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
