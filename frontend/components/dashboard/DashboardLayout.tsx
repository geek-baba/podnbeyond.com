import { ReactNode } from 'react';

interface DashboardGridRowProps {
  children: ReactNode;
  className?: string;
}

export function DashboardGridRow({ children, className = '' }: DashboardGridRowProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 ${className}`}>
      {children}
    </div>
  );
}

interface DashboardTwoColumnProps {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}

export function DashboardTwoColumn({ left, right, className = '' }: DashboardTwoColumnProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

interface DashboardThreeColumnProps {
  children: ReactNode;
  className?: string;
}

export function DashboardThreeColumn({ children, className = '' }: DashboardThreeColumnProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
}

