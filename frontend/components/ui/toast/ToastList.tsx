/**
 * Toast Notification System - Toast List Component
 * Renders toasts in a portal with animations
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Toast } from './types';
import { Toast as ToastComponent } from './Toast';

interface ToastListProps {
  toasts: Toast[];
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onDismiss: (id: string) => void;
}

export const ToastList: React.FC<ToastListProps> = ({ toasts, position, onDismiss }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  // Position classes
  const positionClasses = {
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'top-center': 'top-6 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
  };

  const containerClasses = `fixed ${positionClasses[position]} z-50 flex flex-col gap-3 pointer-events-none max-w-md w-full sm:max-w-sm`;

  return createPortal(
    <div
      className={containerClasses}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast, index) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>,
    document.body
  );
};

