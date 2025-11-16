/**
 * Toast Notification System - Hook
 * Provides toast API for components
 */

import { useContext } from 'react';
import { ToastContext } from './ToastContext';
import { ToastOptions, ToastContextValue } from './types';

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

