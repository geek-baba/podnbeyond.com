import React, { forwardRef, useEffect, useRef } from 'react';

/**
 * Textarea Component
 * Accessible textarea with error states and optional auto-resize
 */

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  error?: string;
  variant?: 'default' | 'error' | 'disabled';
  size?: 'sm' | 'md';
  autoResize?: boolean;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      error,
      variant = 'default',
      size = 'md',
      autoResize = false,
      className = '',
      disabled = false,
      required = false,
      id,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const internalRef = ref || textareaRef;

    // Auto-resize functionality
    useEffect(() => {
      if (autoResize && internalRef && 'current' in internalRef && internalRef.current) {
        const textarea = internalRef.current;
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set height to scrollHeight
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [autoResize, props.value, internalRef]);

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
    const errorId = error ? `${id || 'textarea'}-error` : undefined;
    const descriptionId = ariaDescribedBy || errorId;

    return (
      <>
        <textarea
          ref={internalRef}
          id={id}
          disabled={disabled || effectiveVariant === 'disabled'}
          required={required}
          aria-invalid={ariaInvalid !== undefined ? ariaInvalid : !!error}
          aria-describedby={descriptionId}
          aria-required={required}
          className={`w-full border rounded-button focus:outline-none focus:ring-2 ${sizeClasses[size]} ${variantClasses[effectiveVariant]} ${autoResize ? 'resize-none overflow-hidden' : ''} ${className}`}
          {...props}
        />
        {error && errorId && (
          <div id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}
      </>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;

