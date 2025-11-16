/**
 * Toast Notification System - TypeScript Types
 */

import React from 'react';

/**
 * Toast variant types
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast action configuration
 */
export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

/**
 * Toast options when creating a toast
 */
export interface ToastOptions {
  /** Toast variant (required) */
  variant: ToastVariant;
  
  /** Toast title (required) */
  title: string;
  
  /** Optional message/description */
  message?: string;
  
  /** Auto-dismiss duration in milliseconds (null = persistent) */
  duration?: number | null;
  
  /** Optional custom icon (ReactNode) */
  icon?: React.ReactNode;
  
  /** Optional action button */
  action?: ToastAction;
  
  /** Unique ID (auto-generated if not provided) */
  id?: string;
  
  /** Additional className */
  className?: string;
}

/**
 * Internal toast state (extends ToastOptions with internal fields)
 */
export interface Toast extends ToastOptions {
  id: string;
  createdAt: number;
  isVisible: boolean;
  isDismissing: boolean;
}

/**
 * Toast context value
 */
export interface ToastContextValue {
  /** Function to show a toast */
  toast: (options: ToastOptions) => string;
  
  /** Function to dismiss a toast by ID */
  dismiss: (id: string) => void;
  
  /** Function to dismiss all toasts */
  dismissAll: () => void;
  
  /** Get all active toasts */
  toasts: Toast[];
}

/**
 * Toast provider props
 */
export interface ToastProviderProps {
  children: React.ReactNode;
  
  /** Maximum number of visible toasts (default: 3) */
  maxToasts?: number;
  
  /** Default duration in milliseconds (default: 4000) */
  defaultDuration?: number;
  
  /** Toast position (default: 'top-right') */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

