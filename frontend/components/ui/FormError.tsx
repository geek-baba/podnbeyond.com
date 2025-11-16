import React from 'react';

/**
 * FormError Component
 * Error message for form fields
 */

interface FormErrorProps {
  message: string;
  id?: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({
  message,
  id,
  className = '',
}) => {
  if (!message) {
    return null;
  }

  return (
    <div
      id={id}
      className={`mt-1 text-sm text-red-600 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
};

export default FormError;

