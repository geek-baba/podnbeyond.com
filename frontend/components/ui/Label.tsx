import React from 'react';

/**
 * Label Component
 * Accessible label with required/optional indicator
 */

interface LabelProps {
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({
  htmlFor,
  required = false,
  optional = false,
  children,
  className = '',
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-neutral-700 mb-1 ${className}`}
    >
      {children}
      {required && (
        <span className="text-red-600 ml-1" aria-label="required">
          *
        </span>
      )}
      {optional && !required && (
        <span className="text-neutral-500 ml-1 text-xs font-normal">(optional)</span>
      )}
    </label>
  );
};

export default Label;

