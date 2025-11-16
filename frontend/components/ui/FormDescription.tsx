import React from 'react';

/**
 * FormDescription Component
 * Helper text for form fields
 */

interface FormDescriptionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const FormDescription: React.FC<FormDescriptionProps> = ({
  children,
  id,
  className = '',
}) => {
  if (!children) {
    return null;
  }

  return (
    <div
      id={id}
      className={`mt-1 text-sm text-neutral-500 ${className}`}
    >
      {children}
    </div>
  );
};

export default FormDescription;

