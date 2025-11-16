import React, { forwardRef } from 'react';

/**
 * SelectNative Component
 * Native select element with consistent styling matching Input component
 */

export interface SelectNativeProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  error?: string;
  variant?: 'default' | 'error' | 'disabled';
  size?: 'sm' | 'md';
  className?: string;
}

export const SelectNative = forwardRef<HTMLSelectElement, SelectNativeProps>(
  (
    {
      error,
      variant = 'default',
      size = 'md',
      className = '',
      disabled = false,
      required = false,
      id,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      children,
      ...props
    },
    ref
  ) => {
    // Determine variant based on error prop if variant not explicitly set
    const effectiveVariant = error ? 'error' : variant === 'disabled' || disabled ? 'disabled' : 'default';

    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
    };

    const variantClasses = {
      default: 'border-neutral-300 focus:ring-neutral-900 focus:border-neutral-900',
      error: 'border-red-500 focus:ring-red-600 focus:border-red-600',
      disabled: 'border-neutral-200 bg-neutral-50 text-neutral-500 cursor-not-allowed',
    };

    // Generate error ID if error exists
    const errorId = error ? `${id || 'select'}-error` : undefined;
    const descriptionId = ariaDescribedBy || errorId;

    return (
      <>
        <select
          ref={ref}
          id={id}
          disabled={disabled || effectiveVariant === 'disabled'}
          required={required}
          aria-invalid={ariaInvalid !== undefined ? ariaInvalid : !!error}
          aria-describedby={descriptionId}
          aria-required={required}
          className={`w-full border rounded-button focus:outline-none focus:ring-2 bg-white ${sizeClasses[size]} ${variantClasses[effectiveVariant]} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && errorId && (
          <div id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}
      </>
    );
  }
);

SelectNative.displayName = 'SelectNative';

export default SelectNative;

