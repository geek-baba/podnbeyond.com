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
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
export type { BadgeProps };


