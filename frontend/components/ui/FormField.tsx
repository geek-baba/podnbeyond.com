import React, { useId } from 'react';
import Label from './Label';
import FormError from './FormError';
import FormDescription from './FormDescription';

/**
 * FormField Component
 * Wrapper that combines Label, Input/Textarea, Description, and Error
 */

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  optional = false,
  description,
  error,
  children,
  className = '',
}) => {
  const generatedId = useId();
  const fieldId = htmlFor || generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const descriptionId = description ? `${fieldId}-description` : undefined;

  // Clone children to add id and aria-describedby if needed
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const childProps: any = {
        id: child.props.id || fieldId,
        'aria-describedby': [
          descriptionId,
          errorId,
          child.props['aria-describedby'],
        ]
          .filter(Boolean)
          .join(' '),
      };

      // If child is Input or Textarea and has error prop, remove it to avoid duplicate errors
      if ((child.type as any)?.displayName === 'Input' || (child.type as any)?.displayName === 'Textarea') {
        if (child.props.error) {
          const { error: _, ...restProps } = child.props;
          return React.cloneElement(child, { ...restProps, ...childProps });
        }
      }

      return React.cloneElement(child, childProps);
    }
    return child;
  });

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={fieldId} required={required} optional={optional}>
          {label}
        </Label>
      )}
      {description && (
        <FormDescription id={descriptionId}>{description}</FormDescription>
      )}
      {childrenWithProps}
      {error && <FormError id={errorId} message={error} />}
    </div>
  );
};

export default FormField;

