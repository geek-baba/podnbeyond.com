import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  onClick,
}) => {
  // Base styles
  const baseStyles = 'bg-white rounded-card overflow-hidden';

  // Variant styles
  const variantStyles = {
    default: 'shadow-card',
    elevated: 'shadow-card-hover',
    bordered: 'border border-neutral-200',
  };

  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Hover effect
  const hoverStyle = hover ? 'hover:shadow-card-hover transition-shadow duration-300 cursor-pointer' : '';

  // Interactive
  const interactiveStyle = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyle} ${interactiveStyle} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;

