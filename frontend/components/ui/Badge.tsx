import React from 'react';

// ============================================================================
// Badge Component Variants
// Design system compliant: neutral-* for grays, semantic colors for meaning
// ============================================================================

export type BadgeVariant =
  // Brand variants (existing)
  | 'capsule'
  | 'smart'
  | 'sanctuary'
  | 'sauna'
  // System variants (existing)
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  // Booking status variants (new)
  | 'pending'
  | 'confirmed'
  | 'hold'
  | 'cancelled'
  | 'checkedIn'
  | 'checkedOut'
  | 'noShow'
  | 'completed'
  | 'failed'
  // Loyalty tier variants (new)
  | 'member'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  // Booking source variants (new)
  | 'webDirect'
  | 'walkIn'
  | 'phone'
  | 'corporate'
  | 'ota';

// Helper function to get default icon for a variant
function getDefaultIcon(variant: BadgeVariant): React.ReactNode | null {
  const iconSize = 'w-3 h-3';
  
  // Booking status icons
  if (variant === 'pending') {
    return (
      <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    );
  }
  if (variant === 'confirmed') {
    return (
      <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  }
  if (variant === 'checkedIn') {
    return (
      <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
      </svg>
    );
  }
  if (variant === 'cancelled' || variant === 'failed') {
    return (
      <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  }
  
  // Loyalty tier icons (stars)
  if (variant === 'member') {
    return (
      <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  if (variant === 'silver') {
    return (
      <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  if (variant === 'gold') {
    return (
      <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  if (variant === 'platinum') {
    return (
      <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  if (variant === 'diamond') {
    return (
      <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  
  return null;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  // Use provided icon, or default icon for variant if available
  const displayIcon = icon !== undefined ? icon : getDefaultIcon(variant);
  // Variant styles - All use design system colors (neutral-* instead of gray-*)
  const variantStyles: Record<BadgeVariant, string> = {
    // Brand variants (existing - unchanged)
    capsule: 'bg-capsule-100 text-capsule-800 border border-capsule-200',
    smart: 'bg-smart-100 text-smart-800 border border-smart-200',
    sanctuary: 'bg-sanctuary-100 text-sanctuary-800 border border-sanctuary-200',
    sauna: 'bg-sauna-100 text-sauna-800 border border-sauna-200',
    
    // System variants (existing - using semantic colors which are acceptable)
    neutral: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    
    // Booking status variants (new)
    // PENDING: Blue (awaiting action/info state)
    pending: 'bg-blue-100 text-blue-800 border border-blue-200',
    // CONFIRMED: Green (success/positive state)
    confirmed: 'bg-green-100 text-green-800 border border-green-200',
    // HOLD: Yellow (warning/temporary state)
    hold: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    // CANCELLED: Red (error/negative state)
    cancelled: 'bg-red-100 text-red-800 border border-red-200',
    // CHECKED_IN: Purple (in-progress/active state)
    checkedIn: 'bg-purple-100 text-purple-800 border border-purple-200',
    // CHECKED_OUT: Neutral (completed/inactive - using neutral-* instead of gray-*)
    checkedOut: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
    // NO_SHOW: Orange (warning state)
    noShow: 'bg-orange-100 text-orange-800 border border-orange-200',
    // COMPLETED: Green (success state)
    completed: 'bg-green-100 text-green-800 border border-green-200',
    // FAILED/REJECTED: Red (error state)
    failed: 'bg-red-100 text-red-800 border border-red-200',
    
    // Loyalty tier variants (new)
    // MEMBER: Blue (base tier)
    member: 'bg-blue-100 text-blue-800 border border-blue-200',
    // SILVER: Neutral (using neutral-* instead of gray-*)
    silver: 'bg-neutral-100 text-neutral-700 border border-neutral-300',
    // GOLD: Yellow/Gold
    gold: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    // PLATINUM: Neutral (premium but muted - using neutral-* instead of gray-*)
    platinum: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
    // DIAMOND: Purple (highest tier, premium)
    diamond: 'bg-purple-100 text-purple-800 border border-purple-200',
    
    // Booking source variants (new)
    // WEB_DIRECT: Blue (direct booking)
    webDirect: 'bg-blue-100 text-blue-800 border border-blue-200',
    // WALK_IN: Green (positive/direct)
    walkIn: 'bg-green-100 text-green-800 border border-green-200',
    // PHONE: Purple (communication channel)
    phone: 'bg-purple-100 text-purple-800 border border-purple-200',
    // CORPORATE: Indigo (business)
    corporate: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    // OTA: Yellow (third-party, warning color)
    ota: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  };

  // Size styles (existing - unchanged)
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      role="status"
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {displayIcon && <span className="flex-shrink-0">{displayIcon}</span>}
      {children}
    </span>
  );
};

export default Badge;
export type { BadgeProps };


