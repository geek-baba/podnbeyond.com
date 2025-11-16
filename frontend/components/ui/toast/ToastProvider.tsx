/**
 * Toast Notification System - Provider Component
 * Manages toast queue and state
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ToastContext } from './ToastContext';
import { Toast, ToastOptions, ToastProviderProps, ToastContextValue } from './types';
import { ToastList } from './ToastList';

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 3,
  defaultDuration = 4000,
  position = 'top-right',
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Generate unique ID
  const generateId = () => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Dismiss a toast
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => {
      const updated = prev.map((toast) =>
        toast.id === id ? { ...toast, isDismissing: true } : toast
      );
      
      // Remove after animation
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 200); // Match exit animation duration
      
      return updated;
    });

    // Clear timer if exists
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    setToasts((prev) => prev.map((toast) => ({ ...toast, isDismissing: true })));
    setTimeout(() => {
      setToasts([]);
    }, 200);
    
    // Clear all timers
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  // Show a toast
  const toast = useCallback((options: ToastOptions): string => {
    const id = options.id || generateId();
    const duration = options.duration !== undefined ? options.duration : defaultDuration;

    const newToast: Toast = {
      ...options,
      id,
      createdAt: Date.now(),
      isVisible: true,
      isDismissing: false,
      duration: duration === null ? null : (duration || defaultDuration),
    };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      
      // Limit to maxToasts (FIFO - remove oldest)
      if (updated.length > maxToasts) {
        const removed = updated.slice(maxToasts);
        removed.forEach((t) => {
          const timer = timersRef.current.get(t.id);
          if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(t.id);
          }
        });
        return updated.slice(0, maxToasts);
      }
      
      return updated;
    });

    // Set auto-dismiss timer if duration is not null
    if (duration !== null) {
      const timer = setTimeout(() => {
        dismiss(id);
      }, duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [defaultDuration, maxToasts, dismiss]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  // Handle Escape key to dismiss most recent toast
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toasts.length > 0) {
        const mostRecent = toasts[0];
        if (mostRecent && !mostRecent.isDismissing) {
          dismiss(mostRecent.id);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [toasts, dismiss]);

  const contextValue: ToastContextValue = {
    toast,
    dismiss,
    dismissAll,
    toasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastList toasts={toasts} position={position} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

