import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'capsule' | 'smart' | 'sanctuary' | 'sauna' | 'neutral' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  // Variant styles
  const variantStyles = {
    capsule: 'bg-capsule-100 text-capsule-800 border border-capsule-200',
    smart: 'bg-smart-100 text-smart-800 border border-smart-200',
    sanctuary: 'bg-sanctuary-100 text-sanctuary-800 border border-sanctuary-200',
    sauna: 'bg-sauna-100 text-sauna-800 border border-sauna-200',
    neutral: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

