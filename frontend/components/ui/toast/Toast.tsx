/**
 * Toast Notification System - Individual Toast Component
 */

import React, { useEffect, useRef } from 'react';
import { Toast as ToastType } from './types';
import Button from '../Button';

interface ToastProps {
  toast: ToastType;
  onDismiss: () => void;
  style?: React.CSSProperties;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, style }) => {
  const toastRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Auto-focus on mount for keyboard users
  useEffect(() => {
    if (toastRef.current && !toast.isDismissing) {
      toastRef.current.focus();
    }
  }, [toast.isDismissing]);

  // Animate progress bar
  useEffect(() => {
    if (progressRef.current && toast.duration !== null && toast.duration > 0 && !toast.isDismissing) {
      const duration = toast.duration;
      progressRef.current.style.animation = `toast-progress ${duration}ms linear`;
    }
  }, [toast.duration, toast.isDismissing]);

  // Variant colors
  const variantClasses = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600',
      accent: 'bg-green-500',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      accent: 'bg-red-500',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      accent: 'bg-yellow-500',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      accent: 'bg-blue-500',
    },
  };

  const classes = variantClasses[toast.variant];
  const isAssertive = toast.variant === 'error' || toast.variant === 'warning';

  // Default icons
  const defaultIcons = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDismiss();
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes toast-enter {
          from {
            opacity: 0;
            transform: translateX(100%) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }

        @keyframes toast-exit {
          from {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%) translateY(-8px);
          }
        }

        @keyframes toast-progress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .toast-animate-enter,
          .toast-animate-exit,
          .toast-progress-bar {
            animation: none;
          }
        }

        .toast-animate-enter {
          animation: toast-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .toast-animate-exit {
          animation: toast-exit 0.2s cubic-bezier(0.7, 0, 0.84, 0);
        }

        .toast-progress-bar {
          transform-origin: left;
        }
      `}</style>
      <div
        ref={toastRef}
        className={`
          pointer-events-auto
          ${classes.bg}
          ${classes.border}
          border
          rounded-card
          shadow-card
          p-4
          ${toast.isDismissing ? 'toast-animate-exit' : 'toast-animate-enter'}
          ${toast.className || ''}
        `}
        role={isAssertive ? 'alert' : 'status'}
        aria-live={isAssertive ? 'assertive' : 'polite'}
        aria-atomic="true"
        aria-relevant="additions removals"
        aria-label={`${toast.variant} notification: ${toast.title}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={style}
      >
        {/* Progress bar */}
        {toast.duration !== null && !toast.isDismissing && (
          <div
            ref={progressRef}
            className={`absolute top-0 left-0 right-0 h-1 ${classes.accent} rounded-t-card toast-progress-bar`}
            aria-hidden="true"
          />
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${classes.icon}`}>
            {toast.icon || defaultIcons[toast.variant]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${classes.text} mb-1`}>
              {toast.title}
            </h3>
            {toast.message && (
              <p className={`text-sm ${classes.text} opacity-90`}>
                {toast.message}
              </p>
            )}

            {/* Action button */}
            {toast.action && (
              <div className="mt-3">
                <Button
                  onClick={toast.action.onClick}
                  variant={toast.action.variant || 'secondary'}
                  size="sm"
                >
                  {toast.action.label}
                </Button>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${classes.icon} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-neutral-900 rounded-button p-1`}
            aria-label={`Dismiss ${toast.variant} notification`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

