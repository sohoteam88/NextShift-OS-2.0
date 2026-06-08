import * as React from 'react';
import { cn } from '@/lib/cn';

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'search';
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, id, label, error, required, type = 'text', ...props }, ref) => {
    const inputId = id ?? props.name;
    const errorId = error && inputId ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text)]">
            {label}
            {required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={cn(
            'h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:opacity-70',
            error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-red-100',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
