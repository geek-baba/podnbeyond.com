/**
 * Toast Notification System - Context Definition
 */

import { createContext } from 'react';
import { ToastContextValue } from './types';

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

